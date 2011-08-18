from google.appengine.ext import webapp
import unittest
import uuid

TESTS = [
    'appeng.models.ModelTests',
    'appeng.views.ViewTests',
    ]

class TestPage(webapp.RequestHandler):
    def get(self):
        self.response.headers['Content-Type'] = 'text/plain; charset=utf-8'
        suite = unittest.defaultTestLoader.loadTestsFromNames(TESTS)
        unittest.TextTestRunner(stream=self.response.out, verbosity=2).run(suite)
