from google.appengine.ext import db
from settings import LIMITS
import unittest
import uuid

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
        return {'sender': self.sender.pk,
                'recipient': self.recipient.pk,
                'date': str(self.timestamp),
                'text': self.text}

class ModelTests(unittest.TestCase):
    def testVacuous(self):
        self.assertEqual(2,2)
    def aTestFailure(self):
        self.assertEqual(2,3)

    def testUserGet(self):
        n = uuid.uuid4().hex
        u = User.create(n, 'hoo')
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
        k1 = uuid.uuid4().hex
        k2 = uuid.uuid4().hex
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
