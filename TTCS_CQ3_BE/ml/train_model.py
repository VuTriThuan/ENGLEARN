import os
import pandas
import joblib

from sklearn.model_selection import train_test_split
from sklearn.linear_model   import LogisticRegression
from sklearn.metrics        import accuracy_score, classification_report


current_dir = os.path.dirname(os.path.abspath(__file__))
csv_path    = os.path.join(current_dir, "train.csv")
pkl_path    = os.path.join(current_dir, "model.pkl")

print("Đọc dữ liệu từ:", csv_path)
df = pandas.read_csv(csv_path)

FEATURES = [
    "responseTime",
    "correctCount",
    "incorrectCount",
    "rememberRate",
    "daysSinceLastLearn",
]

X = df[FEATURES]
Y = df["isCorrect"]   # nhãn: 1 = nhớ, 0 = quên

print(f"Tổng mẫu  : {len(df):,}")
print(f"   isCorrect=1: {Y.sum():,}  ({Y.mean()*100:.1f}%)")
print(f"   isCorrect=0: {(1-Y).sum():,}  ({(1-Y).mean()*100:.1f}%)")

X_train, X_test, Y_train, Y_test = train_test_split(
    X, Y, test_size=0.2, random_state=71, stratify=Y #đảm bảo tỉ lệ nhãn giữa train và test luôn giống nhau
)

print(f"\nTrain: {len(X_train):,} mẫu  |  Test: {len(X_test):,} mẫu")

model = LogisticRegression(max_iter=1000, random_state=71)
model.fit(X_train, Y_train)

Y_pred = model.predict(X_test)
acc    = accuracy_score(Y_test, Y_pred)

print(f"\nAccuracy: {acc:.4f}")
print("\nBáo cáo chi tiết:")
print(classification_report(
    Y_test, Y_pred,
    target_names=["Quên (0)", "Nhớ (1)"]
))

joblib.dump(model, pkl_path)
print(f"\nĐã lưu model → {pkl_path}")
