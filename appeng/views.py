from google.appengine.ext import webapp
from models import User, Message
from settings import LIMITS
import simplejson as json
import urllib

def js(data):
    return json.dumps(data, ensure_ascii=False)

# View functions return a pair: status code, JSON representation.

def getLimits():
    return 200, js(LIMITS)

def getAllUsers():
    return 200, js([u.name for u in User.all().order('name')])

def getOneUser(name):
    u = User.get(urllib.unquote(name))
    if u is None:
        return 404, js(False)
    else: 
        return 200, u.public_key # public_key is already JSON.

def postUser(name, public_key):
    u, created = User.getOrCreate(urllib.unquote(name), public_key)
    if created:
        return 200, js(True)
    else:
        return 403, js('User already exists')

def getAllMessages():
    return 200, js([m.json() for m in Message.all().order('-timestamp')])

def getMyMessages(name):
    u = User.get(urllib.unquote(name))
    if u is None:
        return 404, js(False)
    else:
        return 200, js([m.json() for m in u.inbox.order('-timestamp')])

def postMessage(sender, recipient, text):
    sender = User.get(urllib.unquote(sender))
    recipient = User.get(urllib.unquote(recipient))
    if(sender is None or recipient is None):
        return 404, js('Sender or recipient not found')
    else:
        Message.create(sender, recipient, text)
        return 200, js(True)

# The rest are adapters (boilerplate) for webapp.RequestHandler

class ViewBase(webapp.RequestHandler):
    def respond(self, (status, result)):
        self.response.set_status(status)
        self.response.headers['Content-Type'] = 'text/plain; charset=utf-8'
        self.response.out.write(result)

class Limits(ViewBase):
    def get(self):
        self.respond(getLimits())

class AllUsers(ViewBase):
    def get(self):
        self.respond(getAllUsers())

class OneUser(ViewBase):
    def get(self, name):
        self.respond(getOneUser(name))

    def post(self, name):
        self.respond(postUser(name, self.request.body))

class AllMessages(ViewBase):
    def get(self):
        self.respond(getAllMessages())

class MyMessages(ViewBase):
    def get(self, name):
        self.respond(getMyMessages(name))

class SendMessage(ViewBase):
    def post(self, sender, recipient):
        self.respond(postMessage(sender, recipient, self.request.body))

ROUTES = [
    ('/cryptoserv/limits/', Limits),
    ('/cryptoserv/users/', AllUsers),
    ('/cryptoserv/users/(.+)', OneUser),
    ('/cryptoserv/messages/', AllMessages),
    ('/cryptoserv/messages/to/(.+)', MyMessages),
    ('/cryptoserv/messages/from/(.+)/to/(.+)', SendMessage),
    ]

