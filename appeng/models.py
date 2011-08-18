from google.appengine.ext import db
from settings import LIMITS

class User(db.Model):
    name = db.StringProperty()
    public_key = db.TextProperty()
    timestamp = db.DateTimeProperty(auto_now_add=True)

    @staticmethod
    def keyOf(name):
        return db.Key.from_path('User', 'u_'+name)

    @staticmethod
    def create(name, public_key):
        assert(len(name) < LIMITS['USERNAME'])
        assert(len(public_key) < LIMITS['KEY'])
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
        m = Message(sender=sender, recipient=recipient, text=text)
        m.put()
        return m

