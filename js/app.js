// 全局变量
let currentJson = null;
let isCompressed = false;
let showLineNumbers = false;
let enableCollapsible = false;

// DOM 元素
let jsonInput, jsonOutput, inputStatus, outputStatus, notification, lineNumbers, outputContainer;

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
    // 初始化 DOM 元素
    jsonInput = document.getElementById('json-input');
    jsonOutput = document.getElementById('json-output');
    inputStatus = document.getElementById('input-status');
    outputStatus = document.getElementById('output-status');
    notification = document.getElementById('notification');
    lineNumbers = document.getElementById('line-numbers');
    outputContainer = document.querySelector('.output-container');
    
    // 初始化配置
    showLineNumbers = CONFIG.features.showLineNumbers;
    enableCollapsible = CONFIG.features.enableCollapsible;
    
    // 显示版本信息
    console.log(`%c🎉 JSON 格式化工具 v${CONFIG.version}`, 'color: #0fd59d; font-size: 16px; font-weight: bold;');
    console.log(`📅 构建日期: ${CONFIG.buildDate}`);
    console.log(`👨‍💻 开发团队: ${CONFIG.author}`);
    
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
            "showLineNumbers": true
        },
        "author": "JSON Tool Team"
    };

    jsonInput.value = JSON.stringify(sampleJson, null, 2);
    processJson();
    
    // 初始化行号显示
    if (showLineNumbers) {
        outputContainer.classList.add('show-line-numbers');
        lineNumbers.style.display = 'block';
    }
    
    // 绑定事件监听器
    const debouncedProcessJson = debounce(processJson, CONFIG.ui.debounceDelay);
    jsonInput.addEventListener('input', debouncedProcessJson);
    jsonInput.addEventListener('drop', handleDrop);
    jsonInput.addEventListener('dragover', handleDragOver);
    jsonInput.addEventListener('dragleave', handleDragLeave);
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
    // 先显示普通的语法高亮
    const highlighted = highlightJson(jsonString);
    jsonOutput.innerHTML = highlighted;
    
    // 如果启用可折叠功能且不是压缩模式，添加可折叠功能
    if (enableCollapsible && !isCompressed) {
        addCollapsibleToOutput();
    }
    
    // 更新行号
    if (showLineNumbers) {
        updateLineNumbers(jsonString);
    }
    
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
        
        // 更新行号
        if (showLineNumbers) {
            updateLineNumbers(compressed);
        }
        
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

// 行号功能
function updateLineNumbers(text) {
    if (!showLineNumbers) {
        lineNumbers.style.display = 'none';
        outputContainer.classList.remove('show-line-numbers');
        return;
    }
    
    // 计算实际的逻辑行数（不包括自动换行）
    let logicalLines;
    if (enableCollapsible && !isCompressed) {
        // 如果启用了可折叠功能，需要计算实际可见的逻辑行数
        logicalLines = countLogicalLines();
    } else {
        // 直接计算原始文本的行数
        logicalLines = text.split('\n').length;
    }
    
    const lineNumbersText = Array.from({length: logicalLines}, (_, index) => index + 1).join('\n');
    lineNumbers.textContent = lineNumbersText;
    lineNumbers.style.display = 'block';
    outputContainer.classList.add('show-line-numbers');
    
    // 同步滚动
    syncLineNumbersScroll();
}

function countLogicalLines() {
    // 简化逻辑：直接使用原始 JSON 的行数
    let originalText;
    if (currentJson) {
        originalText = isCompressed ? 
            JSON.stringify(currentJson) : 
            JSON.stringify(currentJson, null, 2);
    } else {
        // 如果没有有效 JSON，从输出区域获取纯文本
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = jsonOutput.innerHTML;
        // 移除所有 HTML 标签，只保留文本内容
        originalText = tempDiv.textContent || tempDiv.innerText || '';
    }
    
    const lines = originalText.split('\n');
    return Math.max(1, lines.length);
}

function syncLineNumbersScroll() {
    // 同步行号区域和输出区域的滚动
    if (showLineNumbers && outputContainer && lineNumbers) {
        // 移除之前的监听器
        outputContainer.removeEventListener('scroll', handleScroll);
        // 添加新的监听器
        outputContainer.addEventListener('scroll', handleScroll);
    }
}

function handleScroll() {
    if (lineNumbers && outputContainer) {
        lineNumbers.scrollTop = outputContainer.scrollTop;
    }
}

function toggleLineNumbers() {
    showLineNumbers = !showLineNumbers;
    
    if (currentJson) {
        const currentText = isCompressed ? 
            JSON.stringify(currentJson) : 
            JSON.stringify(currentJson, null, 2);
        updateLineNumbers(currentText);
    }
    
    showNotification(showLineNumbers ? '行号已显示' : '行号已隐藏');
}

// 可折叠功能
function addCollapsibleToOutput() {
    // 获取当前的 HTML 内容（已经有语法高亮）
    const htmlContent = jsonOutput.innerHTML;
    const lines = htmlContent.split('\n');
    let result = [];
    let bracketStack = [];
    let toggleCounter = 0;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // 获取纯文本内容来判断结构
        const textContent = line.replace(/<[^>]*>/g, '');
        const trimmedText = textContent.trim();
        const indent = textContent.length - textContent.trimStart().length;
        
        // 检查是否是对象或数组的开始
        if (trimmedText.endsWith('{') || trimmedText.endsWith('[')) {
            const contentId = `content-${toggleCounter}`;
            toggleCounter++;
            
            // 在行的开头添加折叠按钮（保持原有的缩进和高亮）
            const indentMatch = line.match(/^(\s*)/);
            const leadingSpaces = indentMatch ? indentMatch[1] : '';
            const toggleButton = `<span class="collapsible-toggle expanded" data-content="${contentId}"></span>`;
            const restOfLine = line.substring(leadingSpaces.length);
            
            result.push(`${leadingSpaces}${toggleButton}${restOfLine}<span class="collapsible-content" id="${contentId}">`);
            bracketStack.push({ indent, contentId });
            
        } else if ((trimmedText === '}' || trimmedText === ']') && bracketStack.length > 0) {
            const lastBlock = bracketStack[bracketStack.length - 1];
            
            if (indent <= lastBlock.indent) {
                // 结束当前折叠区域
                result.push(`${line}</span>`);
                bracketStack.pop();
            } else {
                result.push(line);
            }
        } else {
            result.push(line);
        }
    }
    
    // 关闭所有未关闭的折叠区域
    while (bracketStack.length > 0) {
        result[result.length - 1] += '</span>';
        bracketStack.pop();
    }
    
    jsonOutput.innerHTML = result.join('\n');
    
    // 添加点击事件监听器
    const toggles = jsonOutput.querySelectorAll('.collapsible-toggle');
    toggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const contentId = this.getAttribute('data-content');
            toggleCollapse(this, contentId);
        });
    });
}

function toggleCollapse(toggleElement, contentId) {
    const content = document.getElementById(contentId);
    
    if (!toggleElement || !content) return;
    
    const isCollapsed = content.classList.contains('collapsed');
    
    if (isCollapsed) {
        // 展开
        content.classList.remove('collapsed');
        toggleElement.classList.remove('collapsed');
        toggleElement.classList.add('expanded');
        
        // 移除占位符
        const placeholder = document.querySelector(`[data-toggle-back="${contentId}"]`);
        if (placeholder) {
            placeholder.remove();
        }
    } else {
        // 折叠
        content.classList.add('collapsed');
        toggleElement.classList.remove('expanded');
        toggleElement.classList.add('collapsed');
        
        // 添加占位符显示折叠的内容概要
        const placeholder = createCollapsePlaceholder(content);
        content.insertAdjacentHTML('afterend', placeholder);
        
        // 为占位符添加点击事件
        const placeholderElement = document.querySelector(`[data-toggle-back="${contentId}"]`);
        if (placeholderElement) {
            placeholderElement.addEventListener('click', function() {
                toggleCollapse(toggleElement, contentId);
            });
        }
    }
    
    // 更新行号
    if (showLineNumbers) {
        setTimeout(() => {
            updateLineNumbers(''); // 传入空字符串，让函数重新计算可见行数
        }, 0);
    }
}

function createCollapsePlaceholder(content) {
    const text = content.textContent.trim();
    const lines = text.split('\n').filter(line => line.trim());
    
    let summary = '';
    if (text.includes('{')) {
        // 计算对象中的键数量
        const keyMatches = text.match(/"[^"]*"\s*:/g);
        const keyCount = keyMatches ? keyMatches.length : 0;
        summary = ` { ${keyCount} ${keyCount === 1 ? 'item' : 'items'} }`;
    } else if (text.includes('[')) {
        // 计算数组中的元素数量
        const commaCount = (text.match(/,/g) || []).length;
        const itemCount = commaCount > 0 ? commaCount + 1 : (lines.length > 2 ? 1 : 0);
        summary = ` [ ${itemCount} ${itemCount === 1 ? 'item' : 'items'} ]`;
    }
    
    return `<span class="collapsible-placeholder" data-toggle-back="${content.id}">${summary}</span>`;
}

function toggleCollapsible() {
    enableCollapsible = !enableCollapsible;
    
    if (currentJson && !isCompressed) {
        const formatted = JSON.stringify(currentJson, null, 2);
        displayJson(formatted);
    }
    
    showNotification(enableCollapsible ? '折叠功能已启用' : '折叠功能已禁用');
}

