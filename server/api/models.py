from django.db import models
from server.settings import LIMITS

# Create your models here.

class User(models.Model):
    name = models.CharField(max_length=LIMITS['USERNAME'], unique=True)
    public_key = models.CharField(max_length=LIMITS['KEY'])
    timestamp = models.DateTimeField(auto_now_add=True)
    def __unicode__(self):
        return self.name

class Message(models.Model):
    sender = models.ForeignKey(User, related_name='outbox')
    recipient = models.ForeignKey(User, related_name='inbox')
    timestamp = models.DateTimeField(auto_now_add=True)
    text = models.TextField(max_length=LIMITS['TEXT'])

    def json(self):
        return {'sender': self.sender.name,
                'recipient': self.recipient.name,
                'date': str(self.timestamp),
                'text': self.text}
