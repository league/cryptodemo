import os                       # -*- python -*-
import sys
from os.path import realpath, dirname

sys.path.append(dirname(dirname(realpath(__file__))))
os.environ['DJANGO_SETTINGS_MODULE'] = 'server.settings'

import django.core.handlers.wsgi
application = django.core.handlers.wsgi.WSGIHandler()
