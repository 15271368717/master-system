"""
M.A.S.T.E.R. System - Build Script
打包脚本 - 将系统打包为可分发格式
"""

import os
import sys
import shutil
import subprocess
from pathlib import Path

# 配置
PROJECT_NAME = "master-system"
VERSION = "2.1.0"
DIST_DIR = Path("dist")
BUILD_DIR = Path("build")

def clean():
    """清理之前的构建"""
    print("[1/5] 清理旧构建...")
    
    dirs_to_clean = [DIST_DIR, BUILD_DIR, Path("backend/build"), Path("backend/dist")]
    for d in dirs_to_clean:
        if d.exists():
            shutil.rmtree(d)
            print(f"  已删除: {d}")
    
    # 清理 __pycache__
    for pycache in Path("backend").rglob("__pycache__"):
        shutil.rmtree(pycache)
    
    print("  清理完成\n")


def check_dependencies():
    """检查构建依赖"""
    print("[2/5] 检查构建工具...")
    
    try:
        import build
        print("  build 模块已安装")
    except ImportError:
        print("  安装 build 模块...")
        subprocess.run([sys.executable, "-m", "pip", "install", "build", "-q"])
    
    print("  检查完成\n")


def build_package():
    """构建 Python 包"""
    print("[3/5] 构建 Python 包...")
    
    try:
        subprocess.run([
            sys.executable, "-m", "build",
            "--wheel", "--sdist",
            "."
        ], check=True)
        print("  包构建完成")
    except subprocess.CalledProcessError as e:
        print(f"  构建失败: {e}")
        return False
    
    print()
    return True


def build_frontend():
    """构建前端"""
    print("[4/5] 构建前端...")
    
    frontend_dir = Path("frontend")
    if not frontend_dir.exists():
        print("  前端目录不存在，跳过")
        return True
    
    # 检查 node_modules
    if not (frontend_dir / "node_modules").exists():
        print("  安装前端依赖...")
        subprocess.run(["npm", "install"], cwd=frontend_dir, check=True)
    
    print("  运行生产构建...")
    result = subprocess.run(["npm", "run", "build"], cwd=frontend_dir, capture_output=True)
    
    if result.returncode == 0:
        print("  前端构建完成")
    else:
        print(f"  前端构建警告: {result.stderr.decode()[:200]}")
    
    print()
    return True


def create_distribution():
    """创建分发包"""
    print("[5/5] 创建分发包...")
    
    dist_files = list(DIST_DIR.glob("*"))
    
    if not dist_files:
        print("  没有找到构建文件")
        return
    
    print("  构建产物:")
    for f in dist_files:
        size = f.stat().st_size / 1024
        print(f"    - {f.name} ({size:.1f} KB)")
    
    # 创建 ZIP 打包
    import zipfile
    zip_name = f"{PROJECT_NAME}-v{VERSION}-win64.zip"
    
    with zipfile.ZipFile(DIST_DIR / zip_name, "w", zipfile.ZIP_DEFLATED) as zf:
        # 添加后端
        for f in Path("backend").rglob("*"):
            if f.is_file() and not any(p in str(f) for p in ["__pycache__", ".pyc", "node_modules"]):
                zf.write(f, f"master-system/backend/{f.name}")
        
        # 添加前端构建
        if (Path("frontend/dist")).exists():
            for f in Path("frontend/dist").rglob("*"):
                if f.is_file():
                    zf.write(f, f"master-system/frontend/{f.relative_to('frontend/dist')}")
        
        # 添加脚本
        for script in ["install.bat", "start-all.bat", "README.md"]:
            if Path(script).exists():
                zf.write(script, f"master-system/{script}")
    
    print(f"  已创建: {zip_name}")
    print()


def main():
    print("=" * 50)
    print(f"  M.A.S.T.E.R. System v{VERSION} 构建脚本")
    print("=" * 50)
    print()
    
    os.chdir(Path(__file__).parent)
    
    clean()
    check_dependencies()
    
    if not build_package():
        print("构建失败!")
        sys.exit(1)
    
    build_frontend()
    create_distribution()
    
    print("=" * 50)
    print("  构建完成!")
    print("  输出目录: dist/")
    print("=" * 50)


if __name__ == "__main__":
    main()