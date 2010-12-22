from django.conf.urls.defaults import *
from django.views.static import serve
from os.path import join, dirname, realpath
from server.api.views import *
from server.settings import DEBUG

# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()

prefix = r'^cryptoserv/' if DEBUG else r'^'

urlpatterns = patterns(
    '',
    (prefix + r'users/$', all_users),
    (prefix + r'users/(?P<name>.+)$', one_user),
    (prefix + r'messages/$', messages),
    (prefix + r'messages/to/(?P<recipient>.+)$', messages),
    (prefix + r'messages/from/(?P<sender>.+)/to/(?P<recipient>.+)$', messages),
    (prefix + r'cron/$', cron),
    (prefix + r'limits/$', limits),
    )

if DEBUG:
    root = join(dirname(dirname(realpath(__file__))), 'client')
    urlpatterns += patterns(
        '',
        (r'^cryptodemo/(?P<path>.*)$', serve,
         {'document_root': root, 'show_indexes': True}),
        )
