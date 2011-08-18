from google.appengine.ext import db
from settings import LIMITS
import simplejson as json

def semiValidPublicKey(s):
    try:                        # Lots of reasons this can fail:
        d = json.loads(s)       # Not valid JSON
        assert(len(d['pq'])>0)  # KeyError 'pq', or not a list
        for n in d['pq']:
            assert(type(n) == int)
        assert(len(d['e'])>0)   # KeyError 'pq', or not a list
        for n in d['e']:
            assert(type(n) == int)
        return True
    except:
        return False

class User(db.Model):
    name = db.StringProperty()
    public_key = db.TextProperty()
    timestamp = db.DateTimeProperty(auto_now_add=True)

    @staticmethod
    def keyOf(name):
        return db.Key.from_path('User', 'u_'+name)

    @staticmethod
    def create(name, public_key):
        assert(len(name) <= LIMITS['USERNAME'])
        assert(len(public_key) <= LIMITS['KEY'])
        assert(semiValidPublicKey(public_key))
        k = User.keyOf(name)
        u = User(key=k, name=name, public_key=public_key)
        u.put()
        return u

    @staticmethod
    def get(name):
        return db.get(User.keyOf(name))

    @staticmethod
    def getOrCreate(name, public_key):
        def txn():
            u = User.get(name)
            if u is None:
                return (User.create(name, public_key), True)
            else:
                return (u, False)
        return db.run_in_transaction(txn)

class Message(db.Model):
    sender = db.ReferenceProperty(User, collection_name='outbox')
    recipient = db.ReferenceProperty(User, collection_name='inbox')
    timestamp = db.DateTimeProperty(auto_now_add=True)
    text = db.TextProperty()

    def json(self):
        return {'sender': self.sender.name,
                'recipient': self.recipient.name,
                'date': str(self.timestamp),
                'text': self.text}

    @staticmethod
    def create(sender, recipient, text):
        assert(len(text) <= LIMITS['TEXT'])
        m = Message(sender=sender, recipient=recipient, text=text)
        m.put()
        return m

