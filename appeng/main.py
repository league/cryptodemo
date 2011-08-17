from appeng.views import ROUTES
from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app

application = webapp.WSGIApplication(ROUTES, debug=True)

def main():
    run_wsgi_app(application)

if __name__ == "__main__":
    main()
