from werkzeug.security import generate_password_hash

password = "test123"  # Your desired password
hashed = generate_password_hash(password)
print("Hashed password:")
print(hashed)