import json
import csv
import os
from pathlib import Path
from typing import List, Dict, Any

class DataManager:
    """Utility class for managing JSON and CSV data files"""
    
    def __init__(self):
        self.data_dir = Path(__file__).parent.parent / 'data'
        
    def load_json(self, filename: str) -> List[Dict[str, Any]]:
        """Load data from a JSON file"""
        file_path = self.data_dir / filename
        
        if not file_path.exists():
            return []
            
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                return json.load(file)
        except (json.JSONDecodeError, IOError) as e:
            print(f"Error loading {filename}: {e}")
            return []
    
    def save_json(self, filename: str, data: List[Dict[str, Any]]) -> bool:
        """Save data to a JSON file"""
        file_path = self.data_dir / filename
        
        try:
            # Create directory if it doesn't exist
            file_path.parent.mkdir(parents=True, exist_ok=True)
            
            with open(file_path, 'w', encoding='utf-8') as file:
                json.dump(data, file, indent=2, ensure_ascii=False)
            return True
        except IOError as e:
            print(f"Error saving {filename}: {e}")
            return False
    
    def load_csv(self, filename: str) -> List[Dict[str, Any]]:
        """Load data from a CSV file"""
        file_path = self.data_dir / filename
        
        if not file_path.exists():
            return []
            
        try:
            # Use Python's built-in csv module
            with open(file_path, 'r', encoding='utf-8') as csvfile:
                reader = csv.DictReader(csvfile)
                return list(reader)
        except Exception as e:
            print(f"Error loading CSV {filename}: {e}")
            return []
    
    def load_users(self) -> List[Dict[str, Any]]:
        """Load users from users.json"""
        return self.load_json('users.json')
    
    def save_users(self, users: List[Dict[str, Any]]) -> bool:
        """Save users to users.json"""
        return self.save_json('users.json', users)
    
    def load_projects(self) -> List[Dict[str, Any]]:
        """Load projects from projects.json"""
        return self.load_json('projects.json')
    
    def save_projects(self, projects: List[Dict[str, Any]]) -> bool:
        """Save projects to projects.json"""
        return self.save_json('projects.json', projects)
    
    def load_models(self) -> List[Dict[str, Any]]:
        """Load models from models.csv"""
        return self.load_csv('models.csv')
    
    def load_branches(self) -> List[Dict[str, Any]]:
        """Load branches from branches.csv"""
        return self.load_csv('branches.csv')

# Global instance
data_manager = DataManager() 