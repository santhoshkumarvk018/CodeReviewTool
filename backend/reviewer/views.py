from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .analysis import analyze_code
from .mongo_utils import mongo_client
import logging
import datetime
import bcrypt
import jwt
from django.conf import settings

logger = logging.getLogger(__name__)

class ReviewCodeView(APIView):
    def post(self, request):
        code_content = request.data.get('code_content')
        file_name = request.data.get('file_name', '')
        language = request.data.get('language', 'python')

        if not code_content:
            return Response({"error": "Code content is required."}, status=status.HTTP_400_BAD_REQUEST)

        # Analyze Code
        issues = analyze_code(code_content, language)

        # Prepare Document for MongoDB
        scan_data = {
            'code_content': code_content,
            'file_name': file_name,
            'language': language,
            'results': issues,
            'created_at': datetime.datetime.utcnow()
        }

        # Save to MongoDB
        try:
            mongo_db = mongo_client.db
            if mongo_db is not None:
                collection = mongo_db['analysis_results']
                result = collection.insert_one(scan_data)
                scan_data['id'] = str(result.inserted_id)
            else:
                 logger.warning("MongoDB connection not available. Skipping MongoDB save.")
        except Exception as e:
            logger.error(f"Error saving to MongoDB: {e}")

        # Remove internal MongoDB _id if present for the response
        if '_id' in scan_data:
            scan_data['id'] = str(scan_data.pop('_id'))

        return Response(scan_data, status=status.HTTP_201_CREATED)

class RegisterView(APIView):
    def post(self, request):
        name = request.data.get('name')
        email = request.data.get('email')
        password = request.data.get('password')

        if not name or not email or not password:
            return Response({"error": "Name, email, and password are required"}, status=status.HTTP_400_BAD_REQUEST)

        mongo_db = mongo_client.db
        if mongo_db is None:
            return Response({"error": "Database error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        users_collection = mongo_db['users']

        # Check if user exists
        if users_collection.find_one({"email": email}):
            return Response({"error": "User with this email already exists"}, status=status.HTTP_400_BAD_REQUEST)

        # Hash password
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        new_user = {
            "name": name,
            "email": email,
            "password": hashed_password,
            "created_at": datetime.datetime.utcnow()
        }

        users_collection.insert_one(new_user)
        return Response({"message": "User registered successfully"}, status=status.HTTP_201_CREATED)

class LoginView(APIView):
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return Response({"error": "Email and password are required"}, status=status.HTTP_400_BAD_REQUEST)

        mongo_db = mongo_client.db
        if mongo_db is None:
            return Response({"error": "Database error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        users_collection = mongo_db['users']
        user = users_collection.find_one({"email": email})

        if not user:
            return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

        # Check password
        if not bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
            return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

        # Generate JWT Token using Django secret key as signature
        token = jwt.encode(
            {
                "user_id": str(user['_id']),
                "email": user['email'],
                "exp": datetime.datetime.utcnow() + datetime.timedelta(days=1)
            },
            settings.SECRET_KEY,
            algorithm="HS256"
        )

        return Response({
            "token": token,
            "user": {
                "name": user['name'],
                "email": user['email']
            }
        }, status=status.HTTP_200_OK)
