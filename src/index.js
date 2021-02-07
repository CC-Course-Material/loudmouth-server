require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const SHA256 = require('crypto-js/hmac-sha256');
const jwtMiddleware = require('express-jwt');
const { Storage } = require('@google-cloud/storage');
const shortid = require('shortid');
const Filter = require('bad-words');

const filter = new Filter({ splitRegex: '*' });

const storage = new Storage({
  projectId: process.env.PROJECT_ID,
  credentials: {
    client_email: process.env.CLIENT_EMAIL,
    private_key: process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
  },
});

const usersBucket = storage.bucket(process.env.USERS_BUCKET);
const messageBucket = storage.bucket(process.env.MESSAGES_BUCKET);

const JWT_MIDDLEWARE = jwtMiddleware({
  secret: process.env.WEB_TOKEN_SECRET,
  algorithms: ['HS256'],
});

const authenticator = (request, response, next) => {
  if (request.user.user) {
    next();
  } else {
    return response.sendStatus(401);
  }
};

const AUTH_MIDDLEWARE = [JWT_MIDDLEWARE, authenticator];

const signData = (data) =>
  jwt.sign(data, process.env.WEB_TOKEN_SECRET, {
    expiresIn: '1h',
  });

const toBuffer = (data) => Buffer.from(JSON.stringify(data));

const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

app.get('/health', async (_, response) => {
  return response.sendStatus(200);
});

app.post('/login', async (request, response) => {
  const { username, password } = request.body;
  if (!password || !username) {
    return response
      .status(400)
      .send({ message: 'Missing username or password.' });
  }

  const userFile = usersBucket.file(username);

  const userExists = await userFile.exists();

  if (!userExists) {
    return response.status(404).send({ message: 'User not found.' });
  }

  const bufferedFile = await userFile.download().then((data) => data[0]);

  try {
    const user = JSON.parse(bufferedFile.toString());

    const { password: savedPassword, ...safeUser } = user;

    const hashedPassword = SHA256(
      password,
      process.env.PASSWORD_HASH_SECRET
    ).toString();

    if (savedPassword !== hashedPassword) {
      return response
        .status(401)
        .send({ message: 'Incorrect username or password.' });
    }

    const token = signData({
      user: safeUser,
    });

    return response.status(200).send({ token });
  } catch (e) {
    return response.status(500).send({ message: 'Unable to retrieve user.' });
  }
});

app.post('/signup', async (request, response) => {
  const { username, password } = request.body;

  if (!password || !username) {
    return response
      .status(400)
      .send({ message: 'Missing username or password.' });
  }

  if (filter.isProfane(username)) {
    return response.status(400).send({ message: 'Invalid username.' });
  }

  const userFile = usersBucket.file(username);

  const user = await userFile
    .get()
    .then((data) => data[0])
    .catch(() => null);

  if (user) {
    return response.status(409).send({ message: 'User already exists.' });
  }

  const hashedPassword = SHA256(
    password,
    process.env.PASSWORD_HASH_SECRET
  ).toString();

  const userData = toBuffer({
    username,
    password: hashedPassword,
  });

  await userFile.save(userData);

  const token = signData({
    user: { username },
  });

  response.status(200).send({ token });
});

app.post('/message', AUTH_MIDDLEWARE, async (request, response) => {
  const {
    user: { username },
  } = request.user;
  const { message } = request.body;
  try {
    if (filter.isProfane(message)) {
      return response.status(400).send({ message: 'Invalid message.' });
    }

    if (!message) {
      return response.status(400).send({ message: 'Missing message' });
    }

    const messageFile = messageBucket.file(`${Date.now()}-${username}`);

    const payload = {
      id: shortid.generate(),
      sender: username,
      createdAt: Date.now(),
      message,
    };

    await messageFile.save(toBuffer(payload));

    return response.status(200).send(payload);
  } catch {
    return response.status(500).send({ message: 'Unable to send message.' });
  }
});

app.get('/message', AUTH_MIDDLEWARE, async (_, response) => {
  const messages = await messageBucket
    .getFiles({
      maxResults: 100,
    })
    .then((data) => {
      const files = data[0];
      return files.map((file) => file.download());
    })
    .catch(() => null);

  if (!messages) {
    return response
      .status(500)
      .send({ message: 'Unable to retrieve messages.' });
  }

  const downloadedMessages = await Promise.all(messages);

  const parsedMessaged = downloadedMessages.map((message) => {
    try {
      return JSON.parse(message[0].toString());
    } catch {
      return null;
    }
  });

  return response
    .status(200)
    .send(parsedMessaged.filter((message) => !!message));
});

app.use((_, response) => {
  return response.sendStatus(404);
});

app.listen(3000, () => {
  console.log(`App listening at http://localhost:3000`);
});
