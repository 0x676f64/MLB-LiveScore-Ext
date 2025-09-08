from pybaseball import statcast_outs_above_average
import datetime
import json
import pandas as pd

def fetch_oaa_current_season(save_path=None, min_attempts=10):
    """
    Fetch Outs Above Average data for the current season
    """
    try:
        year = datetime.datetime.now().year
        print(f"Fetching Outs Above Average for {year} season...")

        # Position codes: 3=1B, 4=2B, 5=3B, 6=SS, 7=LF, 8=CF, 9=RF
        # Note: Catchers (pos=2) are not supported by this function
        positions = [3, 4, 5, 6, 7, 8, 9]  # All positions except catcher
        all_data = []
        
        for pos in positions:
            try:
                print(f"Fetching position {pos} data...")
                pos_df = statcast_outs_above_average(year, pos, min_att=min_attempts)
                
                if len(pos_df) > 0:
                    all_data.append(pos_df)
                    print(f"  Retrieved {len(pos_df)} records for position {pos}")
                else:
                    print(f"  No data for position {pos}")
                    
            except Exception as e:
                print(f"  Error fetching position {pos}: {e}")
                continue
        
        if not all_data:
            print("No data retrieved for any position")
            return None
        
        # Combine all position data
        df = pd.concat(all_data, ignore_index=True)
        print(f"Total records retrieved: {len(df)}")
        
        # Set default save path
        if save_path is None:
            save_path = f"oaa_{year}.json"
        
        # Convert to dictionary and save
        data = df.to_dict(orient="records")
        
        with open(save_path, "w") as f:
            json.dump(data, f, indent=2, default=str)
        
        print(f"Successfully saved {len(data)} players to {save_path}")
        return df
        
    except Exception as e:
        print(f"An error occurred: {e}")
        return None

if __name__ == "__main__":
    fetch_oaa_current_season(min_attempts=10)