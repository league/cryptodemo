from google.appengine.ext import webapp
from views import txt
import unittest
import uuid

TESTS = [
    'appeng.models.ModelTests',
    'appeng.views.ViewTests',
    ]

class TestPage(webapp.RequestHandler):
    def get(self):
        txt(self.response)
        suite = unittest.defaultTestLoader.loadTestsFromNames(TESTS)
        unittest.TextTestRunner(stream=self.response.out, verbosity=2).run(suite)
