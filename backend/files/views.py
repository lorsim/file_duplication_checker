from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter
from django.db.models import Q
from .models import File
from .serializers import FileSerializer
import hashlib
import datetime

# Create your views here.

class FileViewSet(viewsets.ModelViewSet):
    queryset = File.objects.all()
    serializer_class = FileSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter]
    search_fields = ['original_filename']
    filterset_fields = ['file_type', 'size', 'uploaded_at']

    def get_queryset(self):
        queryset = super().get_queryset()
        request = self.request

        size_min = request.query_params.get('minSize')
        size_max = request.query_params.get('maxSize')
        start_date = request.query_params.get('startDate')
        end_date = request.query_params.get('endDate')

        if size_min and size_max:
            queryset = queryset.filter(size__gte=int(size_min) * 1024, size__lte=int(size_max) * 1024)

        if start_date and end_date:
            queryset = queryset.filter(uploaded_at__date__range=[start_date, end_date])
        
        return queryset

    def create(self, request, *args, **kwargs):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        hasher = hashlib.sha256()
        for chunk in file_obj.chunks():
            hasher.update(chunk)
        file_hash = hasher.hexdigest()

        # Check for duplicates
        existing_file = File.objects.filter(file_hash=file_hash).first()
        if existing_file:
            return Response({
                'message': 'Duplicate file detected',
                'file_id': existing_file.id,
                'original_filename': existing_file.original_filename,
                'storage_savings': f"{file_obj.size} bytes saved"
            }, status=status.HTTP_200_OK)

        data = {
            'file': file_obj,
            'original_filename': file_obj.name,
            'file_type': file_obj.content_type,
            'size': file_obj.size,
            'file_hash': file_hash
        }
        
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
