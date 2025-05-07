from flask import Flask, request, jsonify, send_from_directory
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import os
import sqlite3
import json
import time
import numpy as np
import speech_recognition as sr
from datetime import datetime

app = Flask(__name__, static_folder='../client/public')
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# Database setup
DB_PATH = 'alphabet2.db'

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        letter TEXT NOT NULL,
        activity TEXT NOT NULL,
        score REAL NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS ecosystems (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        letter TEXT NOT NULL,
        growth_level INTEGER DEFAULT 1,
        elements TEXT,
        last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    ''')
    
    conn.commit()
    conn.close()
    print("Database initialized")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# Initialize the database on startup
init_db()

# Helper function to calculate pronunciation accuracy
def calculate_pronunciation_accuracy(recognized_text, target_word):
    """Simple algorithm to compare recognized text with target word"""
    recognized_lower = recognized_text.lower().strip()
    target_lower = target_word.lower().strip()
    
    if recognized_lower == target_lower:
        return 1.0  # Perfect match
    
    # Check if target word is in the recognized text
    if target_lower in recognized_lower:
        return 0.8
    
    # Check if first letter matches
    if recognized_lower and target_lower and recognized_lower[0] == target_lower[0]:
        return 0.5
    
    return 0.0  # No match

def generate_pronunciation_feedback(accuracy):
    """Generate friendly feedback based on pronunciation accuracy"""
    if accuracy >= 0.9:
        return "¡Excelente pronunciación!"
    elif accuracy >= 0.7:
        return "¡Muy bien! Casi perfecto."
    elif accuracy >= 0.5:
        return "Buen intento. Sigue practicando."
    else:
        return "Inténtalo de nuevo. Escucha con atención."

def calculate_achievements(user_id, letter):
    """Calculate if user has earned new achievements"""
    conn = get_db_connection()
    
    # Count total activities for this letter
    activities = conn.execute(
        'SELECT COUNT(*) as count FROM progress WHERE user_id = ? AND letter = ?',
        (user_id, letter)
    ).fetchone()['count']
    
    # Get average score
    avg_score = conn.execute(
        'SELECT AVG(score) as avg_score FROM progress WHERE user_id = ? AND letter = ?',
        (user_id, letter)
    ).fetchone()['avg_score'] or 0
    
    conn.close()
    
    # Simple achievement system
    achievements = []
    if activities >= 5:
        achievements.append({"type": "explorer", "letter": letter, "message": "¡Explorador de letra!"})
    if avg_score >= 0.8 and activities >= 3:
        achievements.append({"type": "master", "letter": letter, "message": "¡Maestro de letra!"})
    
    return achievements

# API Routes
@app.route('/api/users', methods=['POST'])
def create_user():
    data = request.json
    username = data.get('username')
    
    if not username:
        return jsonify({'error': 'Username is required'}), 400
    
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute('INSERT INTO users (username) VALUES (?)', (username,))
        conn.commit()
        user_id = cursor.lastrowid
        conn.close()
        return jsonify({'id': user_id, 'username': username}), 201
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'error': 'Username already exists'}), 409
    except Exception as e:
        conn.close()
        return jsonify({'error': str(e)}), 500

@app.route('/api/analyze_pronunciation', methods=['POST'])
def analyze_pronunciation():
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400
        
    audio_file = request.files['audio']
    target_word = request.form.get('target_word', '')
    
    # Save temporarily
    temp_filename = f"temp_audio_{int(time.time())}.wav"
    audio_file.save(temp_filename)
    
    # Use speech recognition
    recognizer = sr.Recognizer()
    try:
        with sr.AudioFile(temp_filename) as source:
            audio_data = recognizer.record(source)
            try:
                recognized_text = recognizer.recognize_google(audio_data)
                accuracy = calculate_pronunciation_accuracy(recognized_text, target_word)
                
                os.remove(temp_filename)  # Clean up
                
                return jsonify({
                    'recognized': recognized_text,
                    'accuracy': accuracy,
                    'feedback': generate_pronunciation_feedback(accuracy)
                })
            except sr.UnknownValueError:
                os.remove(temp_filename)
                return jsonify({'error': 'Speech not recognized'}), 400
            except Exception as e:
                os.remove(temp_filename)
                return jsonify({'error': str(e)}), 500
    except Exception as e:
        if os.path.exists(temp_filename):
            os.remove(temp_filename)
        return jsonify({'error': f'Error processing audio: {str(e)}'}), 500

@app.route('/api/word_builder/validate', methods=['POST'])
def validate_word():
    data = request.json
    word = data.get('word', '').lower()
    available_letters = data.get('available_letters', [])
    
    # Simple dictionary check - in real app, would use a proper dictionary API
    simple_dictionary = [
        'apple', 'ball', 'cat', 'dog', 'egg', 'fish', 'goat', 'hat', 'ice',
        'jam', 'kite', 'lion', 'moon', 'nest', 'owl', 'pan', 'queen', 'rat',
        'sun', 'toy', 'up', 'van', 'win', 'fox', 'yak', 'zoo'
    ]
    
    # Check if word can be formed from available letters
    letter_counts = {}
    for letter in available_letters:
        if letter.lower() not in letter_counts:
            letter_counts[letter.lower()] = 0
        letter_counts[letter.lower()] += 1
    
    for letter in word:
        if letter not in letter_counts or letter_counts[letter] <= 0:
            return jsonify({
                'valid': False,
                'reason': f'La letra "{letter}" no está disponible o ya la has usado.'
            })
        letter_counts[letter] -= 1
    
    # Check if word is in dictionary
    is_valid = word in simple_dictionary
    
    return jsonify({
        'valid': is_valid,
        'points': len(word) * 10 if is_valid else 0,
        'reason': 'Palabra válida' if is_valid else 'Palabra no encontrada en el diccionario'
    })

# WebSocket events
@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

@socketio.on('progress_update')
def handle_progress(data):
    user_id = data.get('user_id')
    letter = data.get('letter')
    activity = data.get('activity')
    score = data.get('score', 0)
    
    if not all([user_id, letter, activity]):
        emit('error', {'message': 'Missing required fields'})
        return
    
    conn = get_db_connection()
    try:
        conn.execute(
            'INSERT INTO progress (user_id, letter, activity, score) VALUES (?, ?, ?, ?)',
            (user_id, letter, activity, score)
        )
        
        # Update ecosystem
        ecosystem = conn.execute(
            'SELECT * FROM ecosystems WHERE user_id = ? AND letter = ?',
            (user_id, letter)
        ).fetchone()
        
        if ecosystem:
            # Increase growth level based on score
            growth_level = ecosystem['growth_level']
            if score > 0.7 and growth_level < 5:  # Max level is 5
                growth_level += 1
                
            # Update ecosystem
            conn.execute(
                'UPDATE ecosystems SET growth_level = ?, last_update = ? WHERE id = ?',
                (growth_level, datetime.now(), ecosystem['id'])
            )
        else:
            # Create new ecosystem
            elements = json.dumps({'plants': 1, 'animals': 0, 'weather': 'sunny'})
            conn.execute(
                'INSERT INTO ecosystems (user_id, letter, growth_level, elements) VALUES (?, ?, ?, ?)',
                (user_id, letter, 1, elements)
            )
        
        conn.commit()
        
        # Get updated ecosystem
        updated_ecosystem = conn.execute(
            'SELECT * FROM ecosystems WHERE user_id = ? AND letter = ?',
            (user_id, letter)
        ).fetchone()
        
        if updated_ecosystem:
            elements = json.loads(updated_ecosystem['elements'])
            growth_level = updated_ecosystem['growth_level']
        else:
            elements = {}
            growth_level = 0
            
        # Calculate achievements
        achievements = calculate_achievements(user_id, letter)
        
        conn.close()
        
        # Emit update to all clients
        emit('progress_updated', {
            'user_id': user_id,
            'letter': letter,
            'ecosystem': {
                'growth_level': growth_level,
                'elements': elements
            },
            'achievements': achievements
        }, broadcast=True)
        
    except Exception as e:
        conn.close()
        emit('error', {'message': str(e)})

@socketio.on('ecosystem_interaction')
def handle_ecosystem_interaction(data):
    user_id = data.get('user_id')
    letter = data.get('letter')
    action = data.get('action')
    
    if not all([user_id, letter, action]):
        emit('error', {'message': 'Missing required fields'})
        return
    
    conn = get_db_connection()
    try:
        ecosystem = conn.execute(
            'SELECT * FROM ecosystems WHERE user_id = ? AND letter = ?',
            (user_id, letter)
        ).fetchone()
        
        if not ecosystem:
            emit('error', {'message': 'Ecosystem not found'})
            conn.close()
            return
        
        elements = json.loads(ecosystem['elements'])
        
        # Process different interactions
        if action == 'water':
            if 'plants' in elements:
                elements['plants'] = min(5, elements['plants'] + 1)
                elements['weather'] = 'rainy'
        elif action == 'feed':
            if 'animals' in elements:
                elements['animals'] = min(5, elements['animals'] + 1)
        
        # Update ecosystem
        conn.execute(
            'UPDATE ecosystems SET elements = ?, last_update = ? WHERE id = ?',
            (json.dumps(elements), datetime.now(), ecosystem['id'])
        )
        conn.commit()
        
        # Get updated ecosystem
        updated_ecosystem = conn.execute(
            'SELECT * FROM ecosystems WHERE user_id = ? AND letter = ?',
            (user_id, letter)
        ).fetchone()
        
        conn.close()
        
        # Emit update to all clients
        emit('ecosystem_updated', {
            'user_id': user_id,
            'letter': letter,
            'ecosystem': {
                'growth_level': updated_ecosystem['growth_level'],
                'elements': json.loads(updated_ecosystem['elements'])
            }
        }, broadcast=True)
        
    except Exception as e:
        if conn:
            conn.close()
        emit('error', {'message': str(e)})

# Serve the frontend
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5001, debug=True)