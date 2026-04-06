from django.apps import AppConfig


class ReviewerConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'reviewer'

    def ready(self):
        from .mongo_utils import mongo_client
        mongo_client.connect()
