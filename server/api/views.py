# Create your views here.

from server.api.models import User, Message
from django.http import *
import simplejson as json

def j(data):
    return json.dumps(data, ensure_ascii=False)

def r(code, data):
    return HttpResponse(data, status=code, content_type='text/plain')

def ok(data):
    return r(200, data)

def all_users(request):
    return ok(j([u.name for u in User.objects.order_by('name')]))

def one_user(request, name):
    return ((post_user if request.method == "POST" else get_user)
            (request, name))

def get_user(request, name):
    try:
        u = User.objects.get(name=name)
        return ok(u.public_key)
    except User.DoesNotExist:
        return r(404, j(False))

def post_user(request, name):
    pk = request.raw_post_data
    u, created = (User.objects.get_or_create
                  (name=name, defaults={'public_key': pk}))
    return ok(j(True)) if created else r(403, j('User already exists'))

def messages(request, sender=None, recipient=None):
    if request.method == "POST":
        return send_message(request, sender, recipient)
    ms = Message.objects
    if sender:
        ms = ms.filter(sender__name = sender)
    if recipient:
        ms = ms.filter(recipient__name = recipient)
    ms = ms.order_by('timestamp').reverse()[:5]
    return ok(j([messageData(m) for m in ms]))

def messageData(m):
    return {'sender': m.sender.name,
            'recipient': m.recipient.name,
            'date': str(m.timestamp),
            'text': m.text}

def send_message(request, sender, recipient):
    if not sender or not recipient:
        return r(400, j('Sender and/or recipient not specified'))
    try:
        s = User.objects.get(name=sender)
        t = User.objects.get(name=recipient)
        m = Message(sender=s, recipient=t, text=request.raw_post_data)
        m.save()
        return ok(j(True))
    except User.DoesNotExist:
        return r(404, j('Sender or recipient not found'))
