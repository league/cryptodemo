from google.appengine.ext import webapp
from models import User, Message, semiValidPublicKey
from settings import LIMITS
import simplejson as json
import unittest
import uuid
import views

TESTS = [
    'appeng.tests.ModelTests',
    'appeng.tests.ViewTests',
    ]

def simulateUrl(s):
    return '%%%02x%s' % (ord(s[0]), s[1:])

def fakePublicKey():
    k = uuid.uuid4().hex
    d = {}
    d['pq'] = [int(k[0:7], 16), int(k[7:14], 16)]
    d['e'] = [int(k[14:21], 16), int(k[21:28], 16)]
    return json.dumps(d)

class ModelTests(unittest.TestCase):
    def testVacuous(self):
        self.assertEqual(2,2)
    def aTestFailure(self):
        self.assertEqual(2,3)

    def testUserGet(self):
        n = uuid.uuid4().hex
        u = User.create(n, fakePublicKey())
        u.put()
        w = User.get(n)
        self.assertEqual(w.name, n)
        self.assertEqual(u.public_key, w.public_key)
        self.assertEqual(u.timestamp, w.timestamp)
        u.delete()
        x = User.get(n)
        self.assertEqual(None, x)

    def testUserGetOrCreate(self):
        n1 = uuid.uuid4().hex
        n2 = uuid.uuid4().hex
        k1 = fakePublicKey()
        k2 = fakePublicKey()
        u1, c1 = User.getOrCreate(n1, public_key=k1)
        self.assertTrue(c1)
        u2, c2 = User.getOrCreate(n1, public_key=k2)
        # u2 should be same as u1, and ignore k2
        self.assertFalse(c2)
        self.assertEqual(u1.name, u2.name)
        self.assertEqual(u1.public_key, u2.public_key)
        self.assertEqual(u1.timestamp, u2.timestamp)
        u1.delete()
        # now n1 can be new.
        u3, c3 = User.getOrCreate(n1, public_key=k2)
        self.assertTrue(c3)
        self.assertEqual(k2, u3.public_key)
        u4 = User.get(n1)
        self.assertEqual(k2, u4.public_key)
        u4.delete()

class ViewTests(unittest.TestCase):

    def setUp(self):
        self.n1, self.n2 = uuid.uuid4().hex, uuid.uuid4().hex
        self.k1, self.k2 = fakePublicKey(), fakePublicKey()
        self.u1 = User.create(self.n1, self.k1)
        self.u2 = User.create(self.n2, self.k2)
        self.m1 = Message.create(self.u1, self.u2, 'u1->u2')
        self.m2 = Message.create(self.u2, self.u1, 'u2->u1')
        self.m3 = Message.create(self.u1, self.u2, 'u1=>u2')

    def tearDown(self):
        self.u1.delete()
        self.u2.delete()
        self.m1.delete()
        self.m2.delete()
        self.m3.delete()

    def testGetLimits(self):
        status, result = views.getLimits()
        self.assertEqual(200, status)
        d = json.loads(result)
        self.assertTrue(d.has_key('USERNAME') and type(d['USERNAME']) == int)
        self.assertTrue(d.has_key('KEY') and type(d['KEY']) == int)
        self.assertTrue(d.has_key('TEXT') and type(d['TEXT']) == int)
        self.assertTrue(d.has_key('MESSAGES') and type(d['MESSAGES']) == int)
        self.assertTrue(d.has_key('DAYS') and type(d['DAYS']) == int)

    def testGetAllUsers(self):
        status, result = views.getAllUsers()
        self.assertEqual(200, status)
        users = json.loads(result)
        found = 0
        for u in users:
            self.assertEqual(unicode, type(u))
            if u == self.n1 or u == self.n2:
                found += 1
        self.assertEqual(2, found)

    def testGetOneUser(self):
        status, result = views.getOneUser(self.n1)
        self.assertEqual(200, status)
        self.assertEqual(self.k1, result)

        n3 = uuid.uuid4().hex
        status, result = views.getOneUser(n3)
        self.assertEqual(404, status)
        self.assertEqual(False, json.loads(result))

        status, result = views.getOneUser(simulateUrl(self.n2))
        self.assertEqual(200, status)
        self.assertEqual(self.k2, result)

    def testPostUser(self):
        n3, k3 = uuid.uuid4().hex, fakePublicKey()
        status, result = views.postUser(n3, k3)
        self.assertEqual(200, status)
        User.get(n3).delete()

        status, result = views.postUser(simulateUrl(self.n1), k3)
        self.assertEqual(403, status)
        self.assertEqual(self.k1, User.get(self.n1).public_key)

        # Public key too long
        k3 ='{"pq":[%s0],"e":[17]}' % ('1,' * (LIMITS['KEY']/2 - 9))
        assert semiValidPublicKey(k3), k3
        assert(len(k3) > LIMITS['KEY'])
        status, result = views.postUser(n3, k3)
        self.assertEqual(400, status)
        self.assertEqual(None, User.get(n3))

        # Public key invalid
        k3 = '{"pq":[3,4],"z":[9]}'
        assert not semiValidPublicKey(k3), k3
        status, result = views.postUser(n3, k3)
        self.assertEqual(400, status)
        self.assertEqual(None, User.get(n3))

        # Username too long
        n3 = uuid.uuid4().hex + ('?' * (LIMITS['USERNAME']-32+1))
        k3 = fakePublicKey()
        assert(len(n3) > LIMITS['USERNAME'])
        status, result = views.postUser(n3, k3)
        self.assertEqual(400, status)
        self.assertEqual(None, User.get(n3))


    def testGetAllMessages(self):
        status, result = views.getAllMessages()
        self.assertEqual(200, status)
        ms = json.loads(result)
        self.assertEqual(3, len(ms))
        self.assertEqual('u1=>u2', ms[0]['text'])
        self.assertEqual(self.u1.name, ms[0]['sender'])
        self.assertEqual(self.u2.name, ms[0]['recipient'])

    def testGetAllMessagesLimit(self):
        n3, k3 = uuid.uuid4().hex, fakePublicKey()
        u3 = User.create(n3, k3)
        ms = [Message.create(u3, u3, uuid.uuid4().hex)
              for i in range(LIMITS['MESSAGES']+1)]
        status, result = views.getAllMessages()
        self.assertEqual(200, status)
        ms1 = json.loads(result)
        self.assertEqual(LIMITS['MESSAGES'], len(ms1))

        status, result = views.getMyMessages(n3)
        self.assertEqual(200, status)
        ms2 = json.loads(result)
        self.assertEqual(LIMITS['MESSAGES'], len(ms2))

        # Clean up
        for m in ms:
            m.delete()
        u3.delete()

    def testGetMyMessages(self):
        status, result = views.getMyMessages(self.n1)
        self.assertEqual(200, status)
        ms1 = json.loads(result)
        self.assertEqual(1, len(ms1))
        self.assertEqual(self.n1, ms1[0]['recipient'])
        self.assertEqual(self.n2, ms1[0]['sender'])

        status, result = views.getMyMessages(self.n2)
        self.assertEqual(200, status)
        ms2 = json.loads(result)
        self.assertEqual(2, len(ms2))
        for m in ms2:
            self.assertEqual(self.n2, m['recipient'])
            self.assertEqual(self.n1, m['sender'])

        status, result = views.getMyMessages(uuid.uuid4().hex)
        self.assertEqual(404, status)

    def testPostMessage(self):
        status, result = views.postMessage(self.n2, simulateUrl(self.n1), '2==>1')
        self.assertEqual(200, status)
        ms = Message.all().order('-timestamp')
        # Race condition: assume nobody else is posting messages!
        self.assertEqual('2==>1', ms[0].text)
        self.assertEqual(self.n2, ms[0].sender.name)
        self.assertEqual(self.n1, ms[0].recipient.name)
        ms[0].delete()

        # Message too long
        status, result = views.postMessage(self.n2, self.n1,
                                           '?' * (LIMITS['TEXT']+1))
        self.assertEqual(400, status)

        # User doesn't exist
        status, result = views.postMessage(self.n1, uuid.uuid4().hex, '??')
        self.assertEqual(404, status)

class TestPage(webapp.RequestHandler):
    def get(self):
        self.response.headers['Content-Type'] = 'text/plain; charset=utf-8'
        suite = unittest.defaultTestLoader.loadTestsFromNames(TESTS)
        unittest.TextTestRunner(stream=self.response.out, verbosity=2).run(suite)
