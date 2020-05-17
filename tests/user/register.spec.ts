/*
load environment variables
*/
require('dotenv').config();

import { expect } from 'chai';
import setCookie from 'set-cookie-parser';
import request, { SuperTest, Test } from 'supertest';

import users from '../test-data/users';

describe('/register', () => {
    let agent: SuperTest<Test>;

    const cleanup = async (): Promise<void> => {
        const res = await agent.post('/deleteAllUsers').send({
            sudoSecret: process.env.SUDO_SECRET,
        });
        expect(res.status).to.equal(202);
    };

    beforeEach(() => {
        agent = request('http://localhost:3300');
        cleanup();
    });

    afterEach(cleanup);

    it('should return 400 if name is not provided', async () => {
        const res = await agent.post('/register').send({
            password: users[0].password,
            phone: users[0].phone,
            email: users[0].email,
            bio: users[0].bio,
        });
        expect(res.status).to.equal(400);
    });

    it('should return 400 if password is not provided', async () => {
        const res = await agent.post('/register').send({
            name: users[0].name,
            phone: users[0].phone,
            email: users[0].email,
            bio: users[0].bio,
        });
        expect(res.status).to.equal(400);
    });

    it('should return 400 if email is not provided', async () => {
        const res = await agent.post('/register').send({
            name: users[0].name,
            password: users[0].password,
            phone: users[0].phone,
            bio: users[0].bio,
        });
        expect(res.status).to.equal(400);
    });

    it('should return 400 if email is invalid format', async () => {
        const res = await agent.post('/register').send({
            name: users[0].name,
            password: users[0].password,
            phone: users[0].phone,
            email: 'invalid',
            bio: users[0].bio,
        });
        expect(res.status).to.equal(400);
    });

    it('should register a new user and give token upon registration', async () => {
        const res = await agent.post('/register').send(users[0]);
        expect(res.header).to.have.property('set-cookie');
        const cookie = setCookie.parse(res.header['set-cookie'], {
            map: true,
        });
        expect(cookie.jwt.value).to.not.equal('');
        expect(res.body).to.have.property('user');
        expect(res.body.user).to.not.have.property('password');
        expect(res.status).to.equal(201);
    });

    it('should return 400 if email is already registered', async () => {
        let res = await agent.post('/register').send(users[0]);
        expect(res.status).to.equal(201);

        res = await agent.post('/register').send({
            name: users[0].name + 'different name ',
            password: users[0].password + 'different password',
            phone: users[0].phone + 'different phone',
            email: users[0].email,
            bio: users[0].bio + 'different bio',
        });
        expect(res.status).to.equal(400);
    });
});
