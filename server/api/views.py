# Create your views here.

from server.api.models import User
from django.http import *
import simplejson as json

def jr(code, data):
    return HttpResponse(json.dumps(data, ensure_ascii=False),
                        status=code, content_type='text/plain')

def ok(data):
    return jr(200, data)

def all_users(request):
    return ok([u.name for u in User.objects.all()])

def one_user(request, name):
    return ((post_user if request.method == "POST" else get_user)
            (request, name))

def get_user(request, name):
    try:
        u = User.objects.get(name=name)
        return ok(u.public_key)
    except User.DoesNotExist:
        return jr(404, False)

def post_user(request, name):
    pk = request.raw_post_data
    u, created = (User.objects.get_or_create
                  (name=name, defaults={'public_key': pk}))
    return ok(True) if created else jr(403, 'User already exists')
