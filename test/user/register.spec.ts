/*
load environment variables
*/
require('dotenv').config();

import { expect } from 'chai';
import setCookie from 'set-cookie-parser';
import request, { SuperTest, Test } from 'supertest';

import App from '../../src/App';
import { MESSAGES } from '../../src/util/constants';
import { TEST_SERVER_URL } from '../../src/util/constants';
import { stdout } from '../../src/util/util';
import users from '../test-data/users';

describe('/register', () => {
    let app: App;
    let agent: SuperTest<Test>;

    before(() => {
        app = new App();
        app.start();
    });

    after(() => {
        app.stop();
    });

    const cleanup = async (): Promise<void> => {
        const res = await agent.post('/deleteAllUsers').send({
            sudoSecret: process.env.SUDO_SECRET,
        });
        expect(res.status).to.equal(204);
    };

    beforeEach(() => {
        agent = request(TEST_SERVER_URL);
        cleanup();
    });

    afterEach(cleanup);

    it('should register a new user and give token upon registration', async () => {
        const res = await agent.post('/register').send({ ...users[0], debug: true });
        expect(res.header).to.have.property('set-cookie');
        const cookie = setCookie.parse(res.header['set-cookie'], {
            map: true,
        });
        expect(cookie.jwt.value).to.not.equal('');
        expect(res.body).to.have.property('user');
        expect(res.body.user).to.not.have.property('password');
        expect(res.status).to.equal(201);
        stdout.printResponse(res);
    });

    it('should return 400 if name is not provided', async () => {
        const res = await agent.post('/register').send({
            password: users[0].password,
            confirmPassword: users[0].confirmPassword,
            phone: users[0].phone,
            email: users[0].email,
            bio: users[0].bio,
        });
        expect(res.text).to.equal(MESSAGES.EMPTY_NAME);
        expect(res.status).to.equal(400);
    });

    it('should return 400 if password is not provided', async () => {
        const res = await agent.post('/register').send({
            name: users[0].name,
            phone: users[0].phone,
            email: users[0].email,
            bio: users[0].bio,
        });
        expect(res.text).to.equal(MESSAGES.EMPTY_PASSWORD);
        expect(res.status).to.equal(400);
    });

    it('should return 400 if password is less than 7 characters', async () => {
        const res = await agent.post('/register').send({
            name: users[0].name,
            phone: users[0].phone,
            email: users[0].email,
            bio: users[0].bio,
            password: '123456',
            confirmPassword: '123456',
        });
        expect(res.text).to.equal(MESSAGES.PASSWORD_TOO_SHORT);
        expect(res.status).to.equal(400);
    });

    it('should return 400 if password is not confirmed', async () => {
        const res = await agent.post('/register').send({
            name: users[0].name,
            phone: users[0].phone,
            email: users[0].email,
            bio: users[0].bio,
            password: users[0].password,
        });
        expect(res.text).to.equal(MESSAGES.CONFIRM_PASSWORD_EMPTY);
        expect(res.status).to.equal(400);
    });

    it('should return 400 if passwords do not match', async () => {
        const res = await agent.post('/register').send({
            name: users[0].name,
            phone: users[0].phone,
            email: users[0].email,
            bio: users[0].bio,
            password: users[0].password,
            confirmPassword: users[0].confirmPassword + 'do not match',
        });
        expect(res.text).to.equal(MESSAGES.PASSWORDS_DO_NOT_MATCH);
        expect(res.status).to.equal(400);
    });

    it('should return 400 if email is not provided', async () => {
        const res = await agent.post('/register').send({
            name: users[0].name,
            password: users[0].password,
            confirmPassword: users[0].confirmPassword,
            phone: users[0].phone,
            bio: users[0].bio,
        });
        expect(res.text).to.equal(MESSAGES.EMPTY_EMAIL);
        expect(res.status).to.equal(400);
    });

    it('should return 400 if email is invalid format', async () => {
        const res = await agent.post('/register').send({
            name: users[0].name,
            password: users[0].password,
            confirmPassword: users[0].confirmPassword,
            phone: users[0].phone,
            email: 'invalid',
            bio: users[0].bio,
        });
        expect(res.text).to.equal(MESSAGES.INVALID_EMAIL);
        expect(res.status).to.equal(400);
    });

    it('should return 400 if email is already registered', async () => {
        let res = await agent.post('/register').send(users[0]);
        expect(res.status).to.equal(201);

        res = await agent.post('/register').send({
            name: users[0].name + 'different name ',
            password: users[0].password + 'different password',
            confirmPassword: users[0].confirmPassword + 'different password',
            phone: users[0].phone + 'different phone',
            email: users[0].email,
            bio: users[0].bio + 'different bio',
        });
        expect(res.text).to.equal(MESSAGES.DUPLICATE_EMAIL);
        expect(res.status).to.equal(400);
    });
});
