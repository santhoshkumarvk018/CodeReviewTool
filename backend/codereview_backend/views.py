from django.http import JsonResponse

def root_view(request):
    return JsonResponse({
        "message": "AI Code Review Backend is running.",
        "endpoints": {
            "admin": "/admin/",
            "analyze": "/api/analyze/"
        }
    })
