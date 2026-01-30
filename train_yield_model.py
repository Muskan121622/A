#!/usr/bin/env python3
"""
Yield Prediction Model Training Script
=====================================

This script trains machine learning models to predict crop yields based on:
- Historical agricultural data from Bihar
- Weather patterns
- Soil conditions
- Crop area and production data

The trained model will be used for the yield prediction feature in AgriSphere AI.
"""

import pandas as pd
import numpy as np
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
import joblib
import warnings
import os
from datetime import datetime

warnings.filterwarnings('ignore')

class YieldPredictor:
    def __init__(self):
        self.models = {}
        self.scalers = {}
        self.encoders = {}
        self.feature_columns = []
        self.target_column = 'yield_kg_per_hectare'
        
    def load_and_prepare_data(self):
        """Load and prepare the agricultural dataset"""
        print("Loading agricultural data...")
        
        # Load the main agricultural dataset
        try:
            df = pd.read_csv('data/bihar_agricultural_data.csv')
            print(f"Loaded {len(df)} records from agricultural dataset")
        except FileNotFoundError:
            print("Error: bihar_agricultural_data.csv not found in data/ directory")
            return None
            
        # Basic data exploration
        print("\nDataset Info:")
        print(f"Shape: {df.shape}")
        print(f"Columns: {list(df.columns)}")
        print(f"Date range: {df['year'].min()} - {df['year'].max()}")
        print(f"Unique crops: {df['crop'].nunique()}")
        print(f"Unique districts: {df['district'].nunique()}")
        
        return df
    
    def feature_engineering(self, df):
        """Create additional features for better prediction"""
        print("Performing feature engineering...")
        
        # Create derived features
        df['productivity'] = df['production_tonnes'] / df['area_hectares']
        df['production_per_hectare'] = df['production_tonnes'] / df['area_hectares']
        
        # Time-based features
        df['year_normalized'] = (df['year'] - df['year'].min()) / (df['year'].max() - df['year'].min())
        
        # Crop type encoding
        crop_encoder = LabelEncoder()
        df['crop_encoded'] = crop_encoder.fit_transform(df['crop'])
        self.encoders['crop'] = crop_encoder
        
        # District encoding
        district_encoder = LabelEncoder()
        df['district_encoded'] = district_encoder.fit_transform(df['district'])
        self.encoders['district'] = district_encoder
        
        # Season encoding
        season_encoder = LabelEncoder()
        df['season_encoded'] = season_encoder.fit_transform(df['season'])
        self.encoders['season'] = season_encoder
        
        # Historical yield trends (rolling averages)
        df = df.sort_values(['district', 'crop', 'year'])
        df['yield_trend_3yr'] = df.groupby(['district', 'crop'])['yield_kg_per_hectare'].transform(lambda x: x.rolling(3, min_periods=1).mean())
        df['yield_trend_5yr'] = df.groupby(['district', 'crop'])['yield_kg_per_hectare'].transform(lambda x: x.rolling(5, min_periods=1).mean())
        
        # Area and production statistics
        df['area_log'] = np.log1p(df['area_hectares'])
        df['production_log'] = np.log1p(df['production_tonnes'])
        
        return df
    
    def prepare_features(self, df):
        """Prepare feature matrix and target variable"""
        print("Preparing features...")
        
        # Define feature columns
        feature_columns = [
            'year_normalized', 'crop_encoded', 'district_encoded', 'season_encoded',
            'area_hectares', 'production_tonnes', 'area_log', 'production_log',
            'yield_trend_3yr', 'yield_trend_5yr'
        ]
        
        # Remove rows with missing values
        df_clean = df[feature_columns + [self.target_column]].dropna()
        
        X = df_clean[feature_columns]
        y = df_clean[self.target_column]
        
        self.feature_columns = feature_columns
        
        print(f"Feature matrix shape: {X.shape}")
        print(f"Target variable shape: {y.shape}")
        
        return X, y
    
    def train_models(self, X, y):
        """Train multiple models and compare performance"""
        print("Training models...")
        
        # Split the data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=None
        )
        
        # Scale features
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)
        self.scalers['standard'] = scaler
        
        # Define models
        models = {
            'Random Forest': RandomForestRegressor(
                n_estimators=100,
                max_depth=15,
                min_samples_split=5,
                min_samples_leaf=2,
                random_state=42,
                n_jobs=-1
            ),
            'Gradient Boosting': GradientBoostingRegressor(
                n_estimators=100,
                max_depth=8,
                learning_rate=0.1,
                random_state=42
            ),
            'Linear Regression': LinearRegression()
        }
        
        results = {}
        
        for name, model in models.items():
            print(f"\nTraining {name}...")
            
            # Use scaled features for Linear Regression, original for tree-based models
            if name == 'Linear Regression':
                X_train_model = X_train_scaled
                X_test_model = X_test_scaled
            else:
                X_train_model = X_train
                X_test_model = X_test
            
            # Train model
            model.fit(X_train_model, y_train)
            
            # Make predictions
            y_pred_train = model.predict(X_train_model)
            y_pred_test = model.predict(X_test_model)
            
            # Calculate metrics
            train_r2 = r2_score(y_train, y_pred_train)
            test_r2 = r2_score(y_test, y_pred_test)
            train_rmse = np.sqrt(mean_squared_error(y_train, y_pred_train))
            test_rmse = np.sqrt(mean_squared_error(y_test, y_pred_test))
            test_mae = mean_absolute_error(y_test, y_pred_test)
            
            # Cross-validation
            cv_scores = cross_val_score(model, X_train_model, y_train, cv=5, scoring='r2')
            
            results[name] = {
                'model': model,
                'train_r2': train_r2,
                'test_r2': test_r2,
                'train_rmse': train_rmse,
                'test_rmse': test_rmse,
                'test_mae': test_mae,
                'cv_mean': cv_scores.mean(),
                'cv_std': cv_scores.std()
            }
            
            print(f"Train R²: {train_r2:.4f}")
            print(f"Test R²: {test_r2:.4f}")
            print(f"Test RMSE: {test_rmse:.2f}")
            print(f"Test MAE: {test_mae:.2f}")
            print(f"CV R² (mean ± std): {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")
        
        # Select best model based on test R²
        best_model_name = max(results.keys(), key=lambda k: results[k]['test_r2'])
        best_model = results[best_model_name]['model']
        
        print(f"\nBest model: {best_model_name}")
        print(f"Best test R²: {results[best_model_name]['test_r2']:.4f}")
        
        self.models['best'] = best_model
        self.models['all'] = {name: result['model'] for name, result in results.items()}
        
        return results, X_test, y_test
    
    def analyze_feature_importance(self, model_results):
        """Analyze feature importance for tree-based models"""
        print("\nAnalyzing feature importance...")
        
        # Get Random Forest model for feature importance
        rf_model = model_results['Random Forest']['model']
        
        if hasattr(rf_model, 'feature_importances_'):
            importance_df = pd.DataFrame({
                'feature': self.feature_columns,
                'importance': rf_model.feature_importances_
            }).sort_values('importance', ascending=False)
            
            print("\nTop 10 Most Important Features:")
            print(importance_df.head(10))
            
            # Plot feature importance
            plt.figure(figsize=(10, 6))
            sns.barplot(data=importance_df.head(10), x='importance', y='feature')
            plt.title('Top 10 Feature Importance (Random Forest)')
            plt.xlabel('Importance')
            plt.tight_layout()
            plt.savefig('feature_importance.png', dpi=300, bbox_inches='tight')
            plt.close()  # Close instead of show
            
            return importance_df
    
    def create_prediction_plots(self, model_results, X_test, y_test):
        """Create prediction vs actual plots"""
        print("Creating prediction plots...")
        
        fig, axes = plt.subplots(1, 3, figsize=(18, 5))
        
        for idx, (name, result) in enumerate(model_results.items()):
            model = result['model']
            
            # Use appropriate features
            if name == 'Linear Regression':
                X_test_model = self.scalers['standard'].transform(X_test)
            else:
                X_test_model = X_test
            
            y_pred = model.predict(X_test_model)
            
            axes[idx].scatter(y_test, y_pred, alpha=0.6)
            axes[idx].plot([y_test.min(), y_test.max()], [y_test.min(), y_test.max()], 'r--', lw=2)
            axes[idx].set_xlabel('Actual Yield (kg/ha)')
            axes[idx].set_ylabel('Predicted Yield (kg/ha)')
            axes[idx].set_title(f'{name}\nR² = {result["test_r2"]:.4f}')
            axes[idx].grid(True, alpha=0.3)
        
        plt.tight_layout()
        plt.savefig('prediction_plots.png', dpi=300, bbox_inches='tight')
        plt.close()  # Close instead of show
    
    def save_models(self):
        """Save trained models and preprocessors"""
        print("Saving models...")
        
        # Create model directory
        os.makedirs('models', exist_ok=True)
        
        # Save best model
        joblib.dump(self.models['best'], 'models/yield_prediction_model.pkl')
        
        # Save all models
        for name, model in self.models['all'].items():
            filename = f"models/yield_model_{name.lower().replace(' ', '_')}.pkl"
            joblib.dump(model, filename)
        
        # Save preprocessors
        joblib.dump(self.scalers, 'models/scalers.pkl')
        joblib.dump(self.encoders, 'models/encoders.pkl')
        
        # Save feature columns
        joblib.dump(self.feature_columns, 'models/feature_columns.pkl')
        
        print("Models saved successfully!")
    
    def create_model_summary(self, model_results, df):
        """Create a summary report"""
        print("Creating model summary...")
        
        summary = {
            'training_date': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'dataset_info': {
                'total_records': len(df),
                'date_range': f"{df['year'].min()} - {df['year'].max()}",
                'unique_crops': df['crop'].nunique(),
                'unique_districts': df['district'].nunique(),
                'crops': list(df['crop'].unique()),
                'districts': list(df['district'].unique())
            },
            'model_performance': {}
        }
        
        for name, result in model_results.items():
            summary['model_performance'][name] = {
                'test_r2': float(result['test_r2']),
                'test_rmse': float(result['test_rmse']),
                'test_mae': float(result['test_mae']),
                'cv_mean': float(result['cv_mean']),
                'cv_std': float(result['cv_std'])
            }
        
        # Save summary
        import json
        with open('models/model_summary.json', 'w') as f:
            json.dump(summary, f, indent=2)
        
        print("Model summary saved!")
        return summary

def main():
    """Main training pipeline"""
    print("=" * 60)
    print("AgriSphere AI - Yield Prediction Model Training")
    print("=" * 60)
    
    # Initialize predictor
    predictor = YieldPredictor()
    
    # Load and prepare data
    df = predictor.load_and_prepare_data()
    if df is None:
        return
    
    # Feature engineering
    df = predictor.feature_engineering(df)
    
    # Prepare features
    X, y = predictor.prepare_features(df)
    
    # Train models
    model_results, X_test, y_test = predictor.train_models(X, y)
    
    # Analyze feature importance
    importance_df = predictor.analyze_feature_importance(model_results)
    
    # Create plots
    predictor.create_prediction_plots(model_results, X_test, y_test)
    
    # Save models
    predictor.save_models()
    
    # Create summary
    summary = predictor.create_model_summary(model_results, df)
    
    print("\n" + "=" * 60)
    print("Training completed successfully!")
    print("=" * 60)
    print("\nModel Performance Summary:")
    for name, metrics in summary['model_performance'].items():
        print(f"\n{name}:")
        print(f"  Test R²: {metrics['test_r2']:.4f}")
        print(f"  Test RMSE: {metrics['test_rmse']:.2f} kg/ha")
        print(f"  Test MAE: {metrics['test_mae']:.2f} kg/ha")
    
    print(f"\nModels saved in 'models/' directory")
    print(f"Plots saved as 'feature_importance.png' and 'prediction_plots.png'")

if __name__ == "__main__":
    main()