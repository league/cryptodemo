from django.db import models

# Create your models here.

class User(models.Model):
    name = models.CharField(max_length=64, unique=True)
    public_key = models.CharField(max_length=1024)
    timestamp = models.DateTimeField(auto_now_add=True)
    def __unicode__(self):
        return self.name

class Message(models.Model):
    sender = models.ForeignKey(User, related_name='outbox')
    recipient = models.ForeignKey(User, related_name='inbox')
    timestamp = models.DateTimeField(auto_now_add=True)
    text = models.TextField(max_length=8192)

    def json(self):
        return {'sender': self.sender.name,
                'recipient': self.recipient.name,
                'date': str(self.timestamp),
                'text': self.text}
