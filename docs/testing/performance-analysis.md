# Performance Testing & Analysis

## Speed Test Data Collection

The `docs/speed_tests/` directory contains tools for analyzing file processing performance:

**Data Collection Process:**

1. Run file processing operations in the browser
2. Copy console log output from browser DevTools console
3. Save console output as `.md` file (e.g., `3_Raw_ConsoleData.md`)

**Analysis Scripts:**

- **`parse_console_log.py`**: Parses browser console logs into structured CSV data

  ```bash
  python parse_console_log.py 3_Raw_ConsoleData.md
  ```

  - Generates `3_FolderAnalysisData.csv` (file metrics)
  - Generates `3_TestSpeedData.csv` (3-stage timing data)

- **`analyze_3stage_data.py`**: Analyzes performance data and provides prediction coefficients
  ```bash
  python analyze_3stage_data.py
  ```

**Hardware-Calibrated Performance System:**
The system uses real-time hardware calibration for accurate predictions:

**Hardware Calibration Process:**

1. **Initial Measurement**: During folder analysis, measure files processed per millisecond (H-factor)
2. **Baseline Comparison**: Compare against baseline H-factor of 1.61 files/ms
3. **Calibration Multiplier**: Calculate hardware-specific adjustment factor
4. **Prediction Scaling**: Apply multiplier to base prediction formulas

**Key Benefits:**

- **Hardware-Adaptive**: Automatically adjusts to different CPU speeds and system performance
- **Real-Time Calibration**: Uses actual measurements rather than static formulas
- **Continuous Learning**: Improves accuracy over time with more measurements
- **No Negative Constants**: Eliminates mathematical edge cases from legacy system
- **Simplified Maintenance**: Single prediction system focused on hardware performance

**Calibration Data Storage:**

- **localStorage Integration**: Stores up to 50 recent measurements
- **Rolling Average**: Uses last 10 measurements for current predictions
- **Performance Tracking**: Monitors H-factor trends and system performance
- **Automatic Cleanup**: Prevents storage bloat with measurement limits
