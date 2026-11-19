# ==========================================================
# AquaSense - Flask REST API Backend (aquasense database)
# ==========================================================

import random
from decimal import Decimal

import mysql.connector
from flask import Flask, jsonify, request
from flask_cors import CORS

from db_config import DB_CONFIG

app = Flask(__name__)
CORS(app)


def get_connection():
    return mysql.connector.connect(**DB_CONFIG)


def clean(rows):
    """MySQL DECIMAL values come back as Decimal objects, turn them into plain numbers."""
    for row in rows:
        for key, val in row.items():
            if isinstance(val, Decimal):
                row[key] = float(val)
    return rows


def run_query(query, params=None, fetch=True):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(query, params or ())
        if fetch:
            return clean(cursor.fetchall())
        conn.commit()
        return {"affected_rows": cursor.rowcount, "last_id": cursor.lastrowid}
    finally:
        cursor.close()
        conn.close()


# ----------------------------------------------------------
# OVERVIEW
# ----------------------------------------------------------
@app.route("/api/overview", methods=["GET"])
def get_overview():
    total_tanks = run_query("SELECT COUNT(*) AS c FROM tank")[0]["c"]
    active_devices = run_query("SELECT COUNT(*) AS c FROM device WHERE status='active'")[0]["c"]
    total_devices = run_query("SELECT COUNT(*) AS c FROM device")[0]["c"]

    latest_readings = run_query(
        """SELECT * FROM (
               SELECT r.reading_id, t.tank_name, 'Temperature' AS parameter,
                      r.temperature AS value, 'C' AS unit, r.recorded_at AS reading_time
               FROM sensorreading r
               JOIN device d ON r.device_id = d.device_id
               JOIN tank t ON d.tank_id = t.tank_id
               WHERE r.temperature IS NOT NULL
               UNION ALL
               SELECT r.reading_id, t.tank_name, 'pH',
                      r.ph, 'pH', r.recorded_at
               FROM sensorreading r
               JOIN device d ON r.device_id = d.device_id
               JOIN tank t ON d.tank_id = t.tank_id
               WHERE r.ph IS NOT NULL
           ) x
           ORDER BY reading_time DESC LIMIT 6"""
    )

    feed_status_counts = run_query(
        """SELECT COALESCE(feed_type, 'unknown') AS status, COUNT(*) AS c
           FROM feedevent GROUP BY COALESCE(feed_type, 'unknown')"""
    )

    tank_status = run_query(
        """SELECT t.tank_id, t.tank_name, t.capacity_litres AS capacity, t.status,
                  (SELECT COUNT(*) FROM device d WHERE d.tank_id = t.tank_id) AS device_count
           FROM tank t ORDER BY t.tank_id"""
    )

    return jsonify({
        "total_tanks": total_tanks,
        "active_devices": active_devices,
        "total_devices": total_devices,
        "latest_readings": latest_readings,
        "feed_status_counts": feed_status_counts,
        "tank_status": tank_status
    })


# ----------------------------------------------------------
# USERS
# ----------------------------------------------------------
@app.route("/api/users", methods=["GET"])
def get_users():
    return jsonify(run_query("SELECT user_id, name, email, role FROM `user` ORDER BY user_id"))


@app.route("/api/users", methods=["POST"])
def add_user():
    data = request.json
    run_query(
        "INSERT INTO `user` (name, email, role) VALUES (%s, %s, %s)",
        (data["name"], data.get("email"), data.get("role", "farmer")),
        fetch=False
    )
    return jsonify({"message": "User added"}), 201


@app.route("/api/users/<int:user_id>", methods=["PUT"])
def update_user(user_id):
    data = request.json
    run_query(
        "UPDATE `user` SET name=%s, email=%s, role=%s WHERE user_id=%s",
        (data["name"], data.get("email"), data["role"], user_id),
        fetch=False
    )
    return jsonify({"message": "User updated"})


@app.route("/api/users/<int:user_id>", methods=["DELETE"])
def delete_user(user_id):
    run_query("DELETE FROM `user` WHERE user_id=%s", (user_id,), fetch=False)
    return jsonify({"message": "User deleted"})


# ----------------------------------------------------------
# TANKS
# ----------------------------------------------------------
@app.route("/api/tanks", methods=["GET"])
def get_tanks():
    return jsonify(run_query(
        """SELECT t.tank_id, t.tank_name, t.species, t.capacity_litres AS capacity,
                  t.location, t.status, u.name AS owner,
                  (SELECT COUNT(*) FROM device d WHERE d.tank_id = t.tank_id) AS device_count
           FROM tank t
           LEFT JOIN `user` u ON t.user_id = u.user_id
           ORDER BY t.tank_id"""
    ))


@app.route("/api/tanks", methods=["POST"])
def add_tank():
    data = request.json
    run_query(
        """INSERT INTO tank (tank_name, species, location, capacity_litres, user_id)
           VALUES (%s, %s, %s, %s, %s)""",
        (data["tank_name"], data.get("species"), data.get("location"),
         data["capacity_litres"], data["user_id"]),
        fetch=False
    )
    return jsonify({"message": "Tank added"}), 201


@app.route("/api/tanks/<int:tank_id>", methods=["DELETE"])
def delete_tank(tank_id):
    run_query("DELETE FROM tank WHERE tank_id=%s", (tank_id,), fetch=False)
    return jsonify({"message": "Tank deleted"})


# ----------------------------------------------------------
# DEVICES
# ----------------------------------------------------------
@app.route("/api/devices", methods=["GET"])
def get_devices():
    return jsonify(run_query(
        """SELECT d.device_id, d.device_type, d.serial_no, d.status,
                  CAST(d.last_calibrated AS CHAR) AS last_calibrated,
                  CAST(d.installed_on AS CHAR) AS installed_on,
                  t.tank_name, t.tank_id
           FROM device d
           LEFT JOIN tank t ON d.tank_id = t.tank_id
           ORDER BY d.device_id"""
    ))


@app.route("/api/devices", methods=["POST"])
def add_device():
    data = request.json
    run_query(
        """INSERT INTO device (device_type, serial_no, status, installed_on, tank_id)
           VALUES (%s, %s, %s, CURDATE(), %s)""",
        (data["device_type"], data.get("serial_no"), data.get("status", "active"), data["tank_id"]),
        fetch=False
    )
    return jsonify({"message": "Device added"}), 201


@app.route("/api/devices/<int:device_id>", methods=["PUT"])
def update_device(device_id):
    data = request.json
    run_query(
        "UPDATE device SET status=%s WHERE device_id=%s",
        (data["status"], device_id),
        fetch=False
    )
    return jsonify({"message": "Device updated"})


@app.route("/api/devices/<int:device_id>", methods=["DELETE"])
def delete_device(device_id):
    run_query("DELETE FROM device WHERE device_id=%s", (device_id,), fetch=False)
    return jsonify({"message": "Device deleted"})


# ----------------------------------------------------------
# SENSOR READINGS
# ----------------------------------------------------------
@app.route("/api/sensor-readings", methods=["GET"])
def get_sensor_readings():
    return jsonify(run_query(
        """SELECT r.reading_id, r.temperature, r.ph, r.recorded_at,
                  d.device_id, d.device_type, t.tank_name
           FROM sensorreading r
           JOIN device d ON r.device_id = d.device_id
           LEFT JOIN tank t ON d.tank_id = t.tank_id
           ORDER BY r.reading_id"""
    ))


@app.route("/api/sensor-readings", methods=["POST"])
def add_sensor_reading():
    data = request.json
    run_query(
        """INSERT INTO sensorreading (device_id, temperature, ph, recorded_at)
           VALUES (%s, %s, %s, NOW())""",
        (data["device_id"], data["temperature"], data["ph"]),
        fetch=False
    )
    return jsonify({"message": "Reading added"}), 201


@app.route("/api/sensor-readings/<int:reading_id>", methods=["DELETE"])
def delete_sensor_reading(reading_id):
    run_query("DELETE FROM sensorreading WHERE reading_id=%s", (reading_id,), fetch=False)
    return jsonify({"message": "Reading deleted"})


# ----------------------------------------------------------
# FEED EVENTS (adding goes through your sp_record_feed procedure)
# ----------------------------------------------------------
@app.route("/api/feed-events", methods=["GET"])
def get_feed_events():
    return jsonify(run_query(
        """SELECT f.feed_id, t.tank_name, u.name AS user_name,
                  f.feed_type, f.feed_qty_g, f.fed_at
           FROM feedevent f
           LEFT JOIN tank t ON f.tank_id = t.tank_id
           LEFT JOIN `user` u ON f.user_id = u.user_id
           ORDER BY f.feed_id"""
    ))


@app.route("/api/feed-events", methods=["POST"])
def add_feed_event():
    data = request.json
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    message = ""
    try:
        cursor.callproc("sp_record_feed", (
            data["tank_id"], data["user_id"], data["feed_type"], data["feed_qty_g"]
        ))
        for result in cursor.stored_results():
            rows = result.fetchall()
            if rows:
                message = rows[0].get("message", "")
        conn.commit()
    finally:
        cursor.close()
        conn.close()

    # the procedure reports problems (like an inactive tank) as a "Failed: ..." message
    if message.startswith("Failed"):
        return jsonify({"error": message}), 400
    return jsonify({"message": message}), 201


@app.route("/api/feed-events/<int:feed_id>", methods=["DELETE"])
def delete_feed_event(feed_id):
    run_query("DELETE FROM feedevent WHERE feed_id=%s", (feed_id,), fetch=False)
    return jsonify({"message": "Feed event deleted"})


# ----------------------------------------------------------
# SIMULATED IoT DATA REFRESH
# ----------------------------------------------------------
@app.route("/api/refresh", methods=["POST"])
def refresh_iot_data():
    """Adds one new simulated temperature + pH reading for every sensor device."""
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT device_id, device_type FROM device")
        devices = cursor.fetchall()

        inserted = 0
        for dev in devices:
            if "feed" in (dev["device_type"] or "").lower():
                continue  # feeders don't produce sensor readings
            temperature = round(random.uniform(22, 29), 1)
            ph = round(random.uniform(6.5, 7.8), 1)
            cursor.execute(
                """INSERT INTO sensorreading (device_id, temperature, ph, recorded_at)
                   VALUES (%s, %s, %s, NOW())""",
                (dev["device_id"], temperature, ph)
            )
            inserted += 1

        conn.commit()
        return jsonify({"message": f"IoT data refreshed. {inserted} new readings simulated."})
    finally:
        cursor.close()
        conn.close()


# ----------------------------------------------------------
# REPORTS (using your views)
# ----------------------------------------------------------
@app.route("/api/reports/tank-device-summary", methods=["GET"])
def tank_device_summary():
    return jsonify(run_query("SELECT * FROM v_tank_dashboard"))


@app.route("/api/reports/feed-summary", methods=["GET"])
def feed_summary():
    return jsonify(run_query("SELECT * FROM v_feed_summary"))


@app.route("/api/reports/latest-reading", methods=["GET"])
def latest_reading():
    return jsonify(run_query("SELECT * FROM v_latest_reading"))


@app.route("/api/reports/device-counts", methods=["GET"])
def device_counts():
    return jsonify(run_query(
        """SELECT t.tank_id, t.tank_name, COUNT(d.device_id) AS device_count
           FROM tank t LEFT JOIN device d ON d.tank_id = t.tank_id
           GROUP BY t.tank_id, t.tank_name"""
    ))


if __name__ == "__main__":
    app.run(debug=True, port=5000)