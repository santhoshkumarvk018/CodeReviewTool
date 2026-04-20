from django.urls import path
from .views import (
    ReviewCodeView, RegisterView, LoginView,
    AnalysisDetailView, HistoryView,
    TrainModelView, MLStatusView
)

urlpatterns = [
    path('analyze/', ReviewCodeView.as_view(), name='analyze-code'),
    path('analyze/<str:analysis_id>/', AnalysisDetailView.as_view(), name='analysis-detail'),
    path('history/', HistoryView.as_view(), name='history'),
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('ml/train/', TrainModelView.as_view(), name='ml-train'),
    path('ml/status/', MLStatusView.as_view(), name='ml-status'),
]

