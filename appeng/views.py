from google.appengine.ext import webapp
from models import User, Message
from settings import LIMITS
import simplejson as json
import urllib

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
        else: # public_key already javascript
            return 200, u.public_key

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

class Limits(ViewBase):
    def get(self):
        self.respond(200, js(LIMITS))


ROUTES = [
    ('/cryptoserv/limits/', Limits),
    ('/cryptoserv/users/', AllUsers),
    ('/cryptoserv/users/(.+)', OneUser),
    ('/cryptoserv/messages/', AllMessages),
    ('/cryptoserv/messages/to/(.+)', MyMessages),
    ('/cryptoserv/messages/from/(.+)/to/(.+)', SendMessage),
    ]

