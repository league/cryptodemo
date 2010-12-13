# Create your views here.

from django.http import HttpResponse

def boo(request):
    return HttpResponse("Hello again world")
