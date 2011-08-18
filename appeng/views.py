from google.appengine.ext import webapp
from models import User, Message
import json
import unittest
import urllib
import uuid

def js(data):
    return json.dumps(data, ensure_ascii=False)

class ViewBase(webapp.RequestHandler):
    def respond(self, status, result):
        self.response.set_status(status)
        self.response.headers['Content-Type'] = 'text/plain; charset=utf-8'
        self.response.out.write(result)

    def getAllUsers(self):
        return 200, js([u.name for u in User.all().order('name')])

    def getOneUser(self, name):
        u = User.get(urllib.unquote(name))
        if u is None:
            return 404, js(False)
        else:
            return 200, js(u.public_key)

    def postUser(self, name, public_key):
        u, created = User.getOrCreate(urllib.unquote(name), public_key)
        if created:
            return 200, js(True)
        else:
            return 403, js('User already exists')

    def getAllMessages(self):
        return 200, js([m.json() for m in Message.all().order('-timestamp')])

    def getMyMessages(self, name):
        u = User.get(urllib.unquote(name))
        if u is None:
            return 404, js(False)
        else:
            return 200, js([m.json() for m in u.inbox.order('-timestamp')])

    def postMessage(self, sender, recipient, text):
        sender = User.get(urllib.unquote(sender))
        recipient = User.get(urllib.unquote(recipient))
        if(sender is None or recipient is None):
            return 404, js('Sender or recipient not found')
        else:
            Message.create(sender, recipient, text)
            return 200, js(True)

def simulateUrl(s):
    return '%%%02x%s' % (ord(s[0]), s[1:])

class ViewTests(unittest.TestCase):

    def setUp(self):
        self.views = ViewBase()
        self.n1, self.n2 = uuid.uuid4().hex, uuid.uuid4().hex
        self.k1, self.k2 = uuid.uuid4().hex, uuid.uuid4().hex
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

    def testGetAllUsers(self):
        status, result = self.views.getAllUsers()
        self.assertEqual(200, status)
        users = json.loads(result)
        found = 0
        for u in users:
            self.assertEqual(unicode, type(u))
            if u == self.n1 or u == self.n2:
                found += 1
        self.assertEqual(2, found)

    def testGetOneUser(self):
        status, result = self.views.getOneUser(self.n1)
        self.assertEqual(200, status)
        self.assertEqual(self.k1, json.loads(result))

        n3 = uuid.uuid4().hex
        status, result = self.views.getOneUser(n3)
        self.assertEqual(404, status)
        self.assertEqual(False, json.loads(result))

        status, result = self.views.getOneUser(simulateUrl(self.n2))
        self.assertEqual(200, status)
        self.assertEqual(self.k2, json.loads(result))

    def testPostUser(self):
        n3, k3 = uuid.uuid4().hex, uuid.uuid4().hex
        status, result = self.views.postUser(n3, k3)
        self.assertEqual(200, status)

        status, result = self.views.postUser(simulateUrl(self.n1), k3)
        self.assertEqual(403, status)
        self.assertEqual(self.k1, User.get(self.n1).public_key)

    def testGetAllMessages(self):
        status, result = self.views.getAllMessages()
        self.assertEqual(200, status)
        ms = json.loads(result)
        self.assertEqual(3, len(ms))
        self.assertEqual('u1=>u2', ms[0]['text'])
        self.assertEqual(self.u1.name, ms[0]['sender'])
        self.assertEqual(self.u2.name, ms[0]['recipient'])

    def testGetMyMessages(self):
        status, result = self.views.getMyMessages(self.n1)
        self.assertEqual(200, status)
        ms1 = json.loads(result)
        self.assertEqual(1, len(ms1))
        self.assertEqual(self.n1, ms1[0]['recipient'])
        self.assertEqual(self.n2, ms1[0]['sender'])

        status, result = self.views.getMyMessages(self.n2)
        self.assertEqual(200, status)
        ms2 = json.loads(result)
        self.assertEqual(2, len(ms2))
        for m in ms2:
            self.assertEqual(self.n2, m['recipient'])
            self.assertEqual(self.n1, m['sender'])

        status, result = self.views.getMyMessages(uuid.uuid4().hex)
        self.assertEqual(404, status)

    def testPostMessage(self):
        status, result = self.views.postMessage(self.n2,
                                                simulateUrl(self.n1),
                                                '2==>1')
        self.assertEqual(200, status)
        ms = Message.all().order('-timestamp')
        self.assertEqual('2==>1', ms[0].text)
        self.assertEqual(self.n2, ms[0].sender.name)
        self.assertEqual(self.n1, ms[0].recipient.name)
        ms[0].delete()

class AllUsers(ViewBase):
    def get(self):
        status, result = self.getAllUsers()
        self.respond(status, result)

class OneUser(ViewBase):
    def get(self, name):
        status, result = self.getOneUser(name)
        self.respond(status, result)

    def post(self, name):
        status, result = self.postUser(name, self.request.body)
        self.respond(status, result)

class AllMessages(ViewBase):
    def get(self):
        status, result = self.getAllMessages()
        self.respond(status, result)

class MyMessages(ViewBase):
    def get(self, name):
        status, result = self.getMyMessages(name)
        self.respond(status, result)

class SendMessage(ViewBase):
    def post(self, sender, recipient):
        status, result = self.postMessage(sender, recipient, self.request.body)
        self.respond(status, result)

import tests
ROUTES = [
    ('/users/', AllUsers),
    ('/users/(.+)', OneUser),
    ('/messages/', AllMessages),
    ('/messages/to/(.+)', MyMessages),
    ('/messages/from/(.+)/to/(.+)', SendMessage),
    ('/tests/', tests.TestPage),
    ]

