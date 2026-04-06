import logging
import os
from pymongo import MongoClient
from django.conf import settings

logger = logging.getLogger(__name__)

class MongoDBClient:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MongoDBClient, cls).__new__(cls)
            cls._instance._client = None
            cls._instance._db = None
        return cls._instance

    @property
    def client(self):
        if self._client is None:
            self.connect()
        return self._client

    @property
    def db(self):
        if self._db is None:
            self.connect()
        return self._db

    def connect(self):
        if self._client is None:
            try:
                # Prioritize environment variable, then settings, then default
                mongo_uri = os.environ.get('MONGO_URI') or getattr(settings, 'MONGO_URI', 'mongodb://localhost:27017/')
                db_name = os.environ.get('MONGO_DB_NAME') or getattr(settings, 'MONGO_DB_NAME', 'codereview_db')
                
                logger.info(f"Attempting to connect to MongoDB at {mongo_uri}")
                self._client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
                # Test connection
                self._client.server_info()
                self._db = self._client[db_name]
                logger.info(f"Successfully connected to MongoDB database: {db_name}")
            except Exception as e:
                logger.error(f"Failed to connect to MongoDB: {e}")
                self._client = None
                self._db = None

    def get_collection(self, collection_name):
        database = self.db
        if database is not None:
            return database[collection_name]
        return None

mongo_client = MongoDBClient()
