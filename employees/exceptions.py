from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.db import IntegrityError


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        custom_data = {}
        if isinstance(response.data, dict):
            errors = {}
            for field, value in response.data.items():
                if isinstance(value, list):
                    errors[field] = value
                else:
                    errors[field] = [str(value)]
            if 'detail' in errors:
                custom_data['error'] = str(response.data['detail'])
            else:
                custom_data['error'] = 'Validation failed.'
                custom_data['details'] = errors
        elif isinstance(response.data, list):
            custom_data['error'] = response.data[0] if response.data else 'An error occurred.'
        else:
            custom_data['error'] = str(response.data)

        response.data = custom_data

    return response
