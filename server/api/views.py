# Create your views here.

from server.api.models import User, Message
from django.http import *
import simplejson as json
from datetime import datetime, timedelta
from server.settings import LIMITS

USER_TO_KEEP = 'Crypto Bot'

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
    if len(pk) > LIMITS['KEY']:
        return r(400, j('POST data too long for public key'))
    if not valid_public_key(pk):
        return r(400, j('Invalid public key'))
    u, created = (User.objects.get_or_create
                  (name=name, defaults={'public_key': pk}))
    return ok(j(True)) if created else r(403, j('User already exists'))

def valid_public_key(pk):
    try:
        pk = json.loads(pk)
        return type(pk['pq'])==list and type(pk['e'])==list
    except:
        return False

def messages(request, sender=None, recipient=None):
    if request.method == "POST":
        return send_message(request, sender, recipient)
    ms = Message.objects
    if sender:
        ms = ms.filter(sender__name = sender)
    if recipient:
        ms = ms.filter(recipient__name = recipient)
    ms = ms.order_by('timestamp').reverse()[:LIMITS['MESSAGES']]
    return ok(j([m.json() for m in ms]))

def send_message(request, sender, recipient):
    if not sender or not recipient:
        return r(400, j('Sender and/or recipient not specified'))
    if len(request.raw_post_data) > LIMITS['TEXT']:
        return r(400, j('POST data too long for message body'))
    try:
        s = User.objects.get(name=sender)
        t = User.objects.get(name=recipient)
        m = Message(sender=s, recipient=t, text=request.raw_post_data)
        m.save()
        return ok(j(True))
    except User.DoesNotExist:
        return r(404, j('Sender or recipient not found'))

def cron(request):
    expiry_date = datetime.now() - timedelta(LIMITS['DAYS'])
    expired_users = User.objects.filter(timestamp__lt = expiry_date)
    expired_users = expired_users.exclude(name = USER_TO_KEEP)
    message_count = 0
    for u in expired_users:
        message_count += delete_with_count(u.inbox.all())
        message_count += delete_with_count(u.outbox.all())
    user_count = delete_with_count(expired_users)
    return ok(j((user_count, message_count)))

def delete_with_count(query_set):
    count = len(query_set)
    query_set.delete()
    return count

def limits(request):
    return ok(j(LIMITS))
