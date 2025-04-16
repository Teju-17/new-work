from flask import Flask, render_template, request, redirect, url_for

app = Flask(__name__)

@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        name = request.form['name']
        email = request.form['email']
        password = request.form['password']
        
        if name and email and password:
            return f"Registration Successful! Welcome, {name}."
        else:
            return "All fields are required!"

    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True)
