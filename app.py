from flask import Flask, render_template, json, request
import logging
from waitress import serve
from ebolakbapp.ebolakb import ebolakb
from cedarapp.cedar import cedar

app = Flask(__name__)
app.register_blueprint(ebolakb)
app.register_blueprint(cedar)

# --------------------------------


@app.route("/")
def main():
    return render_template('about.html')


@app.route("/about")
def about():
    return render_template('about.html')


@app.route("/header")
def header():
    return render_template('header.html')


if __name__ == "__main__":
    #serve(app, host='0.0.0.0', port=8080)
    app.run(host="0.0.0.0", port=8080, debug=True)
