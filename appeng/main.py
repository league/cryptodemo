from appeng.views import ROUTES
from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app
from os import environ

if environ.get('SERVER_SOFTWARE', '').startswith('Development'):
    from appeng.tests import TestPage
    ROUTES.append(('/cryptoserv/tests/', TestPage))

application = webapp.WSGIApplication(ROUTES, debug=True)

def main():
    run_wsgi_app(application)

if __name__ == "__main__":
    main()
