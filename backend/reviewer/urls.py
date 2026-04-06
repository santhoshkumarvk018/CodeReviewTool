from django.urls import path
from .views import ReviewCodeView, RegisterView, LoginView

urlpatterns = [
    path('analyze/', ReviewCodeView.as_view(), name='analyze-code'),
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
]
