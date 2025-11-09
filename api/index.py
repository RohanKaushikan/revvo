import sys
import os
import io
import json

# Add server directory to Python path
server_path = os.path.join(os.path.dirname(__file__), '..', 'server')
if server_path not in sys.path:
    sys.path.insert(0, server_path)

from app import create_app

# Create Flask app instance
app = create_app()

# Vercel serverless function handler
# Vercel Python runtime passes a request object with specific attributes
def handler(request):
    # Get the path from request, removing /api prefix
    path = getattr(request, 'path', '/')
    if path.startswith('/api'):
        path = path[4:] or '/'
    
    # Get request body
    body_bytes = b''
    if hasattr(request, 'body'):
        body = request.body
        if isinstance(body, str):
            body_bytes = body.encode('utf-8')
        elif body:
            body_bytes = body if isinstance(body, bytes) else str(body).encode('utf-8')
    
    # Get query string
    query_string = ''
    if hasattr(request, 'query_string'):
        query_string = request.query_string or ''
    elif hasattr(request, 'args'):
        # Fallback: build query string from args
        import urllib.parse
        query_string = urllib.parse.urlencode(request.args) if request.args else ''
    
    # Get headers
    headers_dict = {}
    if hasattr(request, 'headers'):
        headers_dict = dict(request.headers)
    
    # Create WSGI environ dictionary
    host = headers_dict.get('Host', 'localhost')
    server_name = host.split(':')[0] if ':' in host else host
    
    environ = {
        'REQUEST_METHOD': getattr(request, 'method', 'GET'),
        'PATH_INFO': path,
        'QUERY_STRING': query_string,
        'CONTENT_TYPE': headers_dict.get('Content-Type', ''),
        'CONTENT_LENGTH': str(len(body_bytes)),
        'SERVER_NAME': server_name,
        'SERVER_PORT': headers_dict.get('X-Forwarded-Port', '80'),
        'wsgi.version': (1, 0),
        'wsgi.url_scheme': headers_dict.get('X-Forwarded-Proto', 'https'),
        'wsgi.input': io.BytesIO(body_bytes),
        'wsgi.errors': sys.stderr,
        'wsgi.multithread': False,
        'wsgi.multiprocess': False,
        'wsgi.run_once': False,
    }
    
    # Add HTTP headers to environ
    for key, value in headers_dict.items():
        key_upper = key.upper().replace('-', '_')
        if key_upper not in ('CONTENT_TYPE', 'CONTENT_LENGTH'):
            environ[f'HTTP_{key_upper}'] = value
    
    # Response status and headers
    response_status = []
    response_headers = []
    
    def start_response(status, headers):
        response_status.append(status)
        response_headers.extend(headers)
    
    # Call Flask app
    try:
        response_body = app(environ, start_response)
        body_result = b''.join(response_body)
        
        # Parse status code
        status_code = 200
        if response_status:
            status_code = int(response_status[0].split()[0])
        
        # Convert headers to dict
        headers_result = {}
        for key, value in response_headers:
            headers_result[key] = value
        
        # Return response dict (Vercel format)
        return {
            'statusCode': status_code,
            'headers': headers_result,
            'body': body_result.decode('utf-8') if isinstance(body_result, bytes) else str(body_result)
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': str(e)})
        }

