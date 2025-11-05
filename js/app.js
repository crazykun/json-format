// 全局变量
let currentJson = null;
let isCompressed = false;



// DOM 元素
const jsonInput = document.getElementById('json-input');
const jsonOutput = document.getElementById('json-output');
const inputStatus = document.getElementById('input-status');
const outputStatus = document.getElementById('output-status');
const notification = document.getElementById('notification');

// 初始化备案号显示
function initIcpInfo() {
    const icpElement = document.getElementById('icp-info');
    if (!icpElement) return;
    
    const icpParts = [];
    
    if (CONFIG.icpNumber) {
        icpParts.push(CONFIG.icpNumber);
    }
    
    if (CONFIG.policeNumber) {
        icpParts.push(CONFIG.policeNumber);
    }
    
    if (icpParts.length > 0) {
        icpElement.textContent = icpParts.join(' | ');
        icpElement.style.display = 'block';
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', function () {
    // 初始化备案号
    initIcpInfo();
    
    // 加载示例数据
    const sampleJson = {
        "name": "JSON格式化工具",
        "version": "2.0",
        "features": ["格式化", "压缩", "验证", "复制", "下载"],
        "config": {
            "theme": "green",
            "autoFormat": true,
            "showLineNumbers": false
        },
        "author": "JSON Tool Team"
    };

    jsonInput.value = JSON.stringify(sampleJson, null, 2);
    processJson();
});

// 处理 JSON 输入
function processJson() {
    const input = jsonInput.value.trim();

    if (!input) {
        jsonOutput.textContent = '';
        updateStatus(inputStatus, 'default', '等待输入');
        updateStatus(outputStatus, 'default', '等待处理');
        return;
    }

    updateStatus(inputStatus, 'warning', '处理中...');

    try {
        // 解析 JSON
        currentJson = JSON.parse(input);

        // 格式化显示
        const formatted = JSON.stringify(currentJson, null, 2);
        displayJson(formatted);

        updateStatus(inputStatus, 'success', 'JSON 格式正确');
        updateStatus(outputStatus, 'success', '格式化完成');

    } catch (error) {
        // 显示错误信息
        const errorMsg = `解析错误：${error.message}`;
        jsonOutput.innerHTML = `<div class="error-message">${errorMsg}</div>`;

        updateStatus(inputStatus, 'error', '格式错误');
        updateStatus(outputStatus, 'error', '解析失败');

        currentJson = null;
    }
}

// 显示 JSON（带语法高亮）
function displayJson(jsonString) {
    const highlighted = highlightJson(jsonString);
    jsonOutput.innerHTML = highlighted;
    isCompressed = false;
}

// JSON 语法高亮
function highlightJson(jsonString) {
    return jsonString
        .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
            let className = 'json-number';
            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    className = 'json-key';
                } else {
                    className = 'json-string';
                }
            } else if (/true|false/.test(match)) {
                className = 'json-boolean';
            } else if (/null/.test(match)) {
                className = 'json-null';
            }
            return `<span class="${className}">${match}</span>`;
        })
        .replace(/([{}[\],])/g, '<span class="json-punctuation">$1</span>');
}

// 更新状态
function updateStatus(element, type, text) {
    element.className = `status ${type}`;
    element.querySelector('.status-text').textContent = text;
}

// 显示通知
function showNotification(message, type = 'success') {
    const notificationText = notification.querySelector('.notification-text');
    notificationText.textContent = message;

    notification.className = `notification ${type}`;
    notification.classList.add('show');

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// 格式化 JSON
function formatJson() {
    if (!currentJson) {
        showNotification('请先输入有效的 JSON 数据', 'error');
        return;
    }

    const formatted = JSON.stringify(currentJson, null, 2);
    displayJson(formatted);
    showNotification('JSON 格式化完成');
}

// 压缩 JSON
function compressJson() {
    if (!currentJson) {
        showNotification('请先输入有效的 JSON 数据', 'error');
        return;
    }

    if (isCompressed) {
        // 如果已经压缩，则格式化
        formatJson();
    } else {
        // 压缩 JSON
        const compressed = JSON.stringify(currentJson);
        const highlighted = highlightJson(compressed);
        jsonOutput.innerHTML = highlighted;
        isCompressed = true;
        showNotification('JSON 压缩完成');
    }
}

// 验证 JSON
function validateJson() {
    const input = jsonInput.value.trim();

    if (!input) {
        showNotification('请输入 JSON 数据', 'warning');
        return;
    }

    try {
        JSON.parse(input);
        showNotification('JSON 格式验证通过 ✓');
    } catch (error) {
        showNotification(`JSON 格式错误：${error.message}`, 'error');
    }
}

// 清空所有内容
function clearAll() {
    jsonInput.value = '';
    jsonOutput.textContent = '';
    currentJson = null;
    isCompressed = false;

    updateStatus(inputStatus, 'default', '等待输入');
    updateStatus(outputStatus, 'default', '等待处理');

    showNotification('内容已清空');
}

// 复制结果
function copyResult() {
    if (!currentJson) {
        showNotification('没有可复制的内容', 'warning');
        return;
    }

    // 获取当前显示的格式（压缩或格式化）
    const outputText = isCompressed ?
        JSON.stringify(currentJson) :
        JSON.stringify(currentJson, null, 2);

    // 检查是否支持现代剪贴板 API
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(outputText).then(() => {
            showNotification('复制成功 📋');
        }).catch((err) => {
            console.error('剪贴板 API 失败:', err);
            fallbackCopy(outputText);
        });
    } else {
        // 使用降级方案
        fallbackCopy(outputText);
    }
}

// 降级复制方案
function fallbackCopy(text) {
    try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
            showNotification('复制成功 📋');
        } else {
            showNotification('复制失败，请手动复制', 'error');
        }
    } catch (err) {
        console.error('降级复制失败:', err);
        showNotification('复制失败，请手动复制', 'error');
    }
}

// 下载 JSON 文件
function downloadJson() {
    if (!currentJson) {
        showNotification('没有可下载的内容', 'warning');
        return;
    }

    // 获取当前显示的格式（压缩或格式化）
    const outputText = isCompressed ?
        JSON.stringify(currentJson) :
        JSON.stringify(currentJson, null, 2);

    const blob = new Blob([outputText], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `formatted_${new Date().getTime()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showNotification('文件下载成功 💾');
}

// 文件拖拽处理
function handleDragOver(event) {
    event.preventDefault();
    jsonInput.classList.add('drag-over');
}

function handleDragLeave(event) {
    event.preventDefault();
    jsonInput.classList.remove('drag-over');
}

function handleDrop(event) {
    event.preventDefault();
    jsonInput.classList.remove('drag-over');

    const files = event.dataTransfer.files;
    if (files.length === 0) return;

    const file = files[0];

    // 检查文件类型
    if (!file.name.endsWith('.json') && file.type !== 'application/json') {
        showNotification('请拖拽 JSON 文件', 'error');
        return;
    }

    // 读取文件内容
    const reader = new FileReader();
    reader.onload = function (e) {
        jsonInput.value = e.target.result;
        processJson();
        showNotification(`文件 "${file.name}" 加载成功`);
    };

    reader.onerror = function () {
        showNotification('文件读取失败', 'error');
    };

    reader.readAsText(file);
}

// 键盘快捷键
document.addEventListener('keydown', function (event) {
    // Ctrl/Cmd + Enter: 格式化
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        formatJson();
    }

    // Ctrl/Cmd + S: 下载
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        downloadJson();
    }

    // Ctrl/Cmd + C: 复制（当焦点在输出区域时）
    if ((event.ctrlKey || event.metaKey) && event.key === 'c' &&
        document.activeElement === jsonOutput) {
        event.preventDefault();
        copyResult();
    }

    // Ctrl/Cmd + K: 清空
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        clearAll();
    }
});

// 自动调整文本框高度
function autoResize() {
    jsonInput.style.height = 'auto';
    jsonInput.style.height = jsonInput.scrollHeight + 'px';
}

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 绑定防抖的输入处理
const debouncedProcessJson = debounce(processJson, 300);
jsonInput.addEventListener('input', debouncedProcessJson);