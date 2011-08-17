from google.appengine.ext import webapp
from models import User
import json
import unittest
import urllib
import uuid

def txt(response, code=200):
    response.set_status(code)
    response.headers['Content-Type'] = 'text/plain; charset=utf-8'

def js(response, data, code=200):
    txt(response, code)
    response.out.write(json.dumps(data, ensure_ascii=False))

def js(data):
    return json.dumps(data, ensure_ascii=False)

def ok(data):
    return 200, js(data)

class ViewBase(webapp.RequestHandler):
    def respond(self, status, result):
        self.response.set_status(status)
        self.response.headers['Content-Type'] = 'text/plain; charset=utf-8'
        self.response.out.write(result)

    def getAllUsers(self):
        return ok([u.name for u in User.all().order('name')])

    def getOneUser(self, name):
        u = User.get(urllib.unquote(name))
        if u is None:
            return 404, js(False)
        else:
            return ok(u.public_key)

    def postUser(self, name, public_key):
        u, created = User.getOrCreate(name, public_key)
        if created:
            return ok(True)
        else:
            return 403, js('User already exists')

class ViewTests(unittest.TestCase):

    def setUp(self):
        self.views = ViewBase()
        self.n1, self.n2 = uuid.uuid4().hex, uuid.uuid4().hex
        self.k1, self.k2 = uuid.uuid4().hex, uuid.uuid4().hex
        self.u1 = User.create(self.n1, self.k1)
        self.u2 = User.create(self.n2, self.k2)

    def tearDown(self):
        self.u1.delete()
        self.u2.delete()

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

        n2a = '%%%02x%s' % (ord(self.n2[0]), self.n2[1:]) # url-encode
        status, result = self.views.getOneUser(n2a)
        self.assertEqual(200, status)
        self.assertEqual(self.k2, json.loads(result))

    def testPostUser(self):
        n3, k3 = uuid.uuid4().hex, uuid.uuid4().hex
        status, result = self.views.postUser(n3, k3)
        self.assertEqual(200, status)

        status, result = self.views.postUser(self.n1, k3)
        self.assertEqual(403, status)
        self.assertEqual(self.k1, User.get(self.n1).public_key)

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

class MainPage(webapp.RequestHandler):
    def get(self):
        txt(self.response)
        self.response.headers['Content-Type'] = 'text/plain; charset=utf-8'
        self.response.out.write('holle')

import tests
ROUTES = [
    ('/', MainPage),
    ('/users/', AllUsers),
    ('/users/(.+)', OneUser),
    ('/tests/', tests.TestPage),
    ]

