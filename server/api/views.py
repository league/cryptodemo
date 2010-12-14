# Create your views here.

from server.api.models import User
from django.http import *
import simplejson as json

def j(data):
    return json.dumps(data, ensure_ascii=False)

def r(code, data):
    return HttpResponse(data, status=code, content_type='text/plain')

def ok(data):
    return r(200, data)

def all_users(request):
    return ok(j([u.name for u in User.objects.all()]))

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
