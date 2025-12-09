// 全局变量
let currentJson = null;
let isCompressed = false;
let showLineNumbers = false;
let enableCollapsible = false;

// DOM 元素
let jsonInput, jsonOutput, inputStatus, outputStatus, notification, outputContainer;

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

    // 如果显示行号，为每行添加行标记
    if (showLineNumbers) {
        const wrappedContent = wrapLinesForLineNumbers(highlighted);
        jsonOutput.innerHTML = wrappedContent;
    } else {
        // 不显示行号时，用div包装内容并添加内边距
        jsonOutput.innerHTML = `<div class="json-content-wrapper">${highlighted}</div>`;
    }

    // 如果启用可折叠功能且不是压缩模式，添加可折叠功能
    if (enableCollapsible && !isCompressed) {
        addCollapsibleToOutput();
    }

    // 更新行号
    if (showLineNumbers) {
        updateLineNumbers();
    }

    isCompressed = false;
}

function wrapLinesForLineNumbers(htmlContent) {
    // 将每个逻辑行包装在一个表格行中，确保行号与内容完全对应
    const lines = htmlContent.split('\n');
    let tableRows = [];

    for (let i = 0; i < lines.length; i++) {
        const lineNumber = i + 1;
        const lineContent = lines[i] || '&nbsp;'; // 处理空行，使用 &nbsp; 保持行高
        tableRows.push(`<tr class="json-table-row"><td class="json-line-number">${lineNumber}</td><td class="json-line-content">${lineContent}</td></tr>`);
    }

    return `<table class="json-table"><tbody>${tableRows.join('')}</tbody></table>`;
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
            updateLineNumbers();
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
function updateLineNumbers() {
    if (!showLineNumbers) {
        outputContainer.classList.remove('show-line-numbers');
    } else {
        outputContainer.classList.add('show-line-numbers');
    }
    // 表格结构已经内嵌行号，不需要额外处理
}

function toggleLineNumbers() {
    showLineNumbers = !showLineNumbers;

    if (currentJson) {
        const currentText = isCompressed ?
            JSON.stringify(currentJson) :
            JSON.stringify(currentJson, null, 2);
        // 重新显示 JSON 以应用行号包装
        displayJson(currentText);
    }

    showNotification(showLineNumbers ? '行号已显示' : '行号已隐藏');
}

// 可折叠功能
function addCollapsibleToOutput() {
    // 检查是否显示行号模式
    const wrapper = jsonOutput.querySelector('.json-content-wrapper');
    const table = jsonOutput.querySelector('.json-table');

    if (showLineNumbers && table) {
        // 行号模式：处理表格中的内容
        addCollapsibleToTable(table);
    } else if (wrapper) {
        // 普通模式：处理wrapper中的内容
        addCollapsibleToWrapper(wrapper);
    }
}

function addCollapsibleToWrapper(wrapper) {
    const htmlContent = wrapper.innerHTML;
    const lines = htmlContent.split('\n');
    let result = [];
    let bracketPairs = [];
    let toggleCounter = 0;

    // 第一步：找到所有匹配的括号对
    let bracketStack = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const textContent = line.replace(/<[^>]*>/g, '');
        const trimmedText = textContent.trim();
        const indent = textContent.length - textContent.trimStart().length;

        if (trimmedText === '{' || trimmedText === '[' || trimmedText.endsWith('{') || trimmedText.endsWith('[')) {
            const bracketType = trimmedText === '{' || trimmedText.endsWith('{') ? '{' : '[';
            bracketStack.push({ lineIndex: i, indent, type: bracketType });
        } else if ((trimmedText === '}' || trimmedText === ']' || trimmedText.startsWith('}') || trimmedText.startsWith(']')) && bracketStack.length > 0) {
            const expectedType = (trimmedText === '}' || trimmedText.startsWith('}')) ? '{' : '[';

            // 从栈顶向下找到匹配的开始括号
            for (let j = bracketStack.length - 1; j >= 0; j--) {
                if (bracketStack[j].type === expectedType && indent <= bracketStack[j].indent) {
                    const startBracket = bracketStack[j];
                    bracketPairs.push({
                        start: startBracket.lineIndex,
                        end: i,
                        contentId: `content-${toggleCounter++}`
                    });
                    // 移除这个括号和它之后的所有括号
                    bracketStack.splice(j);
                    break;
                }
            }
        }
    }

    // 第二步：按照从外到内的顺序处理括号对，避免嵌套问题
    bracketPairs.sort((a, b) => a.start - b.start);
    console.log('[addCollapsibleToWrapper] 找到', bracketPairs.length, '个括号对:', bracketPairs);
    console.log('[addCollapsibleToWrapper] 总共', lines.length, '行');

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        let hasProcessed = false;

        // 检查这一行是否是某个括号对的开始
        for (let j = 0; j < bracketPairs.length; j++) {
            const bracketPair = bracketPairs[j];

            if (bracketPair.start === i) {
                console.log('[addCollapsibleToWrapper] 处理开始行', i, 'contentId:', bracketPair.contentId, '结束行:', bracketPair.end);
                // 添加折叠按钮
                const indentMatch = line.match(/^(\s*)/);
                const leadingSpaces = indentMatch ? indentMatch[1] : '';
                const toggleButton = `<span class="collapsible-toggle expanded" data-content="${bracketPair.contentId}"></span>`;
                const restOfLine = line.substring(leadingSpaces.length);

                // 查找包含括号的 json-punctuation span（开始括号 { 或 [）
                const bracketSpanMatch = restOfLine.match(/^(.*?)(<span class="json-punctuation">[\[{]<\/span>.*)$/);

                if (bracketSpanMatch) {
                    // 找到了括号 span，将它包含在 collapsible-content 中
                    const beforeBracket = bracketSpanMatch[1];  // 括号前的内容
                    const fromBracket = bracketSpanMatch[2];    // 从括号 span 开始的内容
                    result.push(`${leadingSpaces}${toggleButton}${beforeBracket}<span class="collapsible-content" id="${bracketPair.contentId}">${fromBracket}`);
                } else {
                    // 没找到标准的括号 span，使用原逻辑
                    result.push(`${leadingSpaces}${toggleButton}${restOfLine}<span class="collapsible-content" id="${bracketPair.contentId}">`);
                }
                hasProcessed = true;
                break;
            } else if (bracketPair.end === i) {
                // 这是结束行
                console.log('[addCollapsibleToWrapper] 处理结束行', i, 'contentId:', bracketPair.contentId);
                result.push(line + '</span>');
                hasProcessed = true;
                break;
            }
        }

        if (!hasProcessed) {
            // 普通行
            console.log('[addCollapsibleToWrapper] 普通行', i, ':', line.substring(0, 50));
            result.push(line);
        }
    }

    const finalHTML = result.join('\n');
    console.log('[addCollapsibleToWrapper] 生成的 HTML 前 500 个字符:', finalHTML.substring(0, 500));
    wrapper.innerHTML = finalHTML;

    // 验证生成的元素
    bracketPairs.forEach(pair => {
        const element = document.getElementById(pair.contentId);
        if (element) {
            const text = element.textContent;
            console.log('[addCollapsibleToWrapper] 验证 contentId:', pair.contentId, '内容长度:', text.length, '前50字符:', text.substring(0, 50));
        } else {
            console.warn('[addCollapsibleToWrapper] 找不到元素:', pair.contentId);
        }
    });

    addToggleEventListeners(wrapper);
}

function addCollapsibleToTable(table) {
    const rows = Array.from(table.querySelectorAll('.json-table-row'));
    let bracketPairs = [];
    let toggleCounter = 0;

    // 第一步：找到所有匹配的括号对
    let bracketStack = [];
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const contentCell = row.querySelector('.json-line-content');
        if (!contentCell) continue; // 确保元素存在
        
        const textContent = contentCell.textContent;
        const trimmedText = textContent.trim();
        const indent = textContent.length - textContent.trimStart().length;

        if (trimmedText === '{' || trimmedText === '[' || trimmedText.endsWith('{') || trimmedText.endsWith('[')) {
            const bracketType = trimmedText === '{' || trimmedText.endsWith('{') ? '{' : '[';
            bracketStack.push({
                rowIndex: i,
                indent,
                type: bracketType,
                row: row
            });
        } else if ((trimmedText === '}' || trimmedText === ']' || trimmedText.startsWith('}') || trimmedText.startsWith(']')) && bracketStack.length > 0) {
            const expectedType = (trimmedText === '}' || trimmedText.startsWith('}')) ? '{' : '[';

            // 从栈顶向下找到匹配的开始括号
            for (let j = bracketStack.length - 1; j >= 0; j--) {
                if (bracketStack[j].type === expectedType) {
                    // 对于相同缩进级别或更外层的括号进行匹配
                    if (indent <= bracketStack[j].indent || j === bracketStack.length - 1) {
                        const startBracket = bracketStack[j];
                        bracketPairs.push({
                            start: startBracket.rowIndex,
                            end: i,
                            contentId: `content-${toggleCounter++}`,
                            startRow: startBracket.row,
                            endRow: row
                        });
                        // 移除这个括号和它之后的所有括号
                        bracketStack.splice(j);
                        break;
                    }
                }
            }
        }
    }

    // 第二步：按照从内到外的顺序添加折叠功能，避免HTML覆盖问题
    bracketPairs.sort((a, b) => b.start - a.start); // 从内层到外层排序
    console.log('[addCollapsibleToTable] 找到', bracketPairs.length, '个括号对:', bracketPairs);

    bracketPairs.forEach(pair => {
        console.log('[addCollapsibleToTable] 处理括号对:', pair.contentId, 'start:', pair.start, 'end:', pair.end);
        const startRow = pair.startRow;
        const contentCell = startRow.querySelector('.json-line-content');
        if (!contentCell) {
            console.warn('[addCollapsibleToTable] contentCell不存在');
            return; // 确保元素存在
        }

        // 检查是否已经有折叠按钮了
        let toggleButton = contentCell.querySelector('.collapsible-toggle');
        if (!toggleButton) {
            // 创建折叠按钮元素
            toggleButton = document.createElement('span');
            toggleButton.className = 'collapsible-toggle expanded';
            toggleButton.setAttribute('data-content', pair.contentId);

            // 插入到内容单元格的开头
            contentCell.insertBefore(toggleButton, contentCell.firstChild);
            console.log('[addCollapsibleToTable] 创建新按钮:', pair.contentId);
        } else {
            // 确保现有按钮有正确的属性
            toggleButton.setAttribute('data-content', pair.contentId);
            if (!toggleButton.classList.contains('expanded') && !toggleButton.classList.contains('collapsed')) {
                toggleButton.classList.add('expanded');
            }
            console.log('[addCollapsibleToTable] 更新现有按钮:', pair.contentId);
        }

        // 标记相关行
        startRow.setAttribute('data-collapsible-start', pair.contentId);
        pair.endRow.setAttribute('data-collapsible-end', pair.contentId);

        // 标记中间的内容行（跳过已经被内层标记的行）
        const contentRowCount = pair.end - pair.start - 1;
        console.log('[addCollapsibleToTable] 将标记', contentRowCount, '个内容行 (从', pair.start + 1, '到', pair.end - 1, ')');
        let actuallyMarked = 0;
        for (let i = pair.start + 1; i < pair.end; i++) {
            // 只标记尚未被标记的行（避免外层覆盖内层）
            if (!rows[i].hasAttribute('data-collapsible-content')) {
                rows[i].setAttribute('data-collapsible-content', pair.contentId);
                actuallyMarked++;
            }
        }
        console.log('[addCollapsibleToTable] 实际标记了', actuallyMarked, '个新行（跳过了', contentRowCount - actuallyMarked, '个已标记的行）');

        // 验证是否成功标记
        const verifyRows = table.querySelectorAll(`[data-collapsible-content="${pair.contentId}"]`);
        console.log('[addCollapsibleToTable] 验证: 实际标记了', verifyRows.length, '个内容行');
    });

    addToggleEventListeners(table);
}

// 全局事件处理函数，用于处理折叠按钮点击
function collapsibleClickHandler(e) {
    // 检查点击的目标元素是否是折叠按钮
    if (e.target.classList && e.target.classList.contains('collapsible-toggle')) {
        // 找到了折叠按钮
        e.preventDefault();
        e.stopPropagation();
        const contentId = e.target.getAttribute('data-content');
        console.log('[折叠] 点击按钮, contentId:', contentId);
        if (contentId) {  // 确保contentId存在
            toggleCollapse(e.target, contentId);
        }
        return;
    }

    // 检查点击的目标元素是否在折叠按钮内部
    if (e.target.closest) {
        const toggleButton = e.target.closest('.collapsible-toggle');
        if (toggleButton) {
            e.preventDefault();
            e.stopPropagation();
            const contentId = toggleButton.getAttribute('data-content');
            console.log('[折叠] 通过closest找到按钮, contentId:', contentId);
            if (contentId) {  // 确保contentId存在
                toggleCollapse(toggleButton, contentId);
            }
            return;
        }
    }
}

function addToggleEventListeners(container) {
    // 使用事件委托，在容器上绑定一次事件监听器
    // 先移除可能已存在的事件监听器，避免重复绑定
    container.removeEventListener('click', collapsibleClickHandler);
    container.addEventListener('click', collapsibleClickHandler);
}

function toggleCollapse(toggleElement, contentId) {
    if (showLineNumbers) {
        // 表格模式的折叠
        toggleTableCollapse(toggleElement, contentId);
    } else {
        // 普通模式的折叠
        toggleWrapperCollapse(toggleElement, contentId);
    }
}

function toggleWrapperCollapse(toggleElement, contentId) {
    const content = document.getElementById(contentId);
    console.log('[toggleWrapperCollapse] contentId:', contentId, 'content元素:', content, 'toggleElement:', toggleElement);
    if (!toggleElement || !content) {
        console.warn('[toggleWrapperCollapse] 元素不存在！toggleElement:', toggleElement, 'content:', content);
        return;
    }

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
            placeholderElement.addEventListener('click', function () {
                toggleWrapperCollapse(toggleElement, contentId);
            });
        }
    }
}

function toggleTableCollapse(toggleElement, contentId) {
    console.log('[toggleTableCollapse] contentId:', contentId, 'toggleElement:', toggleElement);
    if (!toggleElement) {
        console.warn('[toggleTableCollapse] toggleElement不存在');
        return;
    }

    const table = jsonOutput.querySelector('.json-table');
    if (!table) {
        console.warn('[toggleTableCollapse] table不存在');
        return;
    }

    // 找到开始行和结束行
    const startRow = table.querySelector(`[data-collapsible-start="${contentId}"]`);
    const endRow = table.querySelector(`[data-collapsible-end="${contentId}"]`);

    if (!startRow || !endRow) {
        console.warn('[toggleTableCollapse] 找不到开始行或结束行');
        return;
    }

    // 获取所有行，并找到开始和结束的索引
    const allRows = Array.from(table.querySelectorAll('.json-table-row'));
    const startIndex = allRows.indexOf(startRow);
    const endIndex = allRows.indexOf(endRow);

    console.log('[toggleTableCollapse] 开始行索引:', startIndex, '结束行索引:', endIndex);

    // 要折叠的内容行是从 startIndex+1 到 endIndex-1 的所有行
    const contentRows = allRows.slice(startIndex + 1, endIndex);
    console.log('[toggleTableCollapse] 要折叠的行数:', contentRows.length);

    const isCollapsed = toggleElement.classList.contains('collapsed');

    if (isCollapsed) {
        // 展开
        toggleElement.classList.remove('collapsed');
        toggleElement.classList.add('expanded');

        contentRows.forEach(row => {
            row.style.display = '';
        });

        // 移除占位符
        const placeholder = table.querySelector(`[data-toggle-back="${contentId}"]`);
        if (placeholder) {
            placeholder.remove();
        }
    } else {
        // 折叠
        toggleElement.classList.remove('expanded');
        toggleElement.classList.add('collapsed');

        contentRows.forEach(row => {
            row.style.display = 'none';
        });

        // 创建占位符行
        const startRow = table.querySelector(`[data-collapsible-start="${contentId}"]`);
        if (startRow && contentRows.length > 0) {
            // 检查是否已经存在占位符
            const existingPlaceholder = table.querySelector(`[data-toggle-back="${contentId}"]`);
            if (existingPlaceholder) {
                existingPlaceholder.remove();
            }
            
            const placeholderRow = document.createElement('tr');
            placeholderRow.className = 'json-table-row';
            placeholderRow.setAttribute('data-toggle-back', contentId);
            placeholderRow.style.cursor = 'pointer';

            const lineNumberCell = document.createElement('td');
            lineNumberCell.className = 'json-line-number';
            lineNumberCell.textContent = '...';

            const contentCell = document.createElement('td');
            contentCell.className = 'json-line-content';

            // 计算折叠内容的概要
            const summary = createTableCollapseSummary(contentRows);
            contentCell.innerHTML = `<span class="collapsible-placeholder">${summary}</span>`;

            placeholderRow.appendChild(lineNumberCell);
            placeholderRow.appendChild(contentCell);

            // 插入占位符行
            const lastContentRow = contentRows[contentRows.length - 1];
            lastContentRow.parentNode.insertBefore(placeholderRow, lastContentRow.nextSibling);

            // 为占位符添加点击事件
            placeholderRow.addEventListener('click', function () {
                toggleTableCollapse(toggleElement, contentId);
            });
        }
    }
}

function createTableCollapseSummary(contentRows) {
    let keyCount = 0;
    let isArray = false;
    let isObject = false;

    contentRows.forEach(row => {
        const text = row.textContent;
        if (text.includes(':')) {
            keyCount++;
        }
        if (text.includes('[')) {
            isArray = true;
        }
        if (text.includes('{')) {
            isObject = true;
        }
    });

    if (isObject) {
        return ` { ${keyCount} ${keyCount === 1 ? 'item' : 'items'} }`;
    } else if (isArray) {
        const itemCount = Math.max(1, contentRows.length - 1); // 减去结束括号行
        return ` [ ${itemCount} ${itemCount === 1 ? 'item' : 'items'} ]`;
    } else {
        return ` { ... }`;
    }
}

function createCollapsePlaceholder(content) {
    const text = content.textContent.trim();
    const lines = text.split('\n').filter(line => line.trim());

    let summary = '';
    let startBracket = '';
    let endBracket = '';

    // 判断是对象还是数组
    const firstLine = lines[0] || '';
    const lastLine = lines[lines.length - 1] || '';

    if (firstLine.includes('{') || lastLine.includes('}')) {
        // 对象
        startBracket = '{';
        endBracket = '}';
        // 计算对象中的键数量
        const keyMatches = text.match(/"[^"]*"\s*:/g);
        const keyCount = keyMatches ? keyMatches.length : 0;
        summary = `{ ${keyCount} ${keyCount === 1 ? 'item' : 'items'} }`;
    } else if (firstLine.includes('[') || lastLine.includes(']')) {
        // 数组
        startBracket = '[';
        endBracket = ']';
        // 计算数组中的元素数量 - 更精确的方法
        // 去掉首尾的括号行，统计剩余的有效行数
        const contentLines = lines.slice(1, -1).filter(line => {
            const trimmed = line.trim();
            return trimmed && trimmed !== ',' && !trimmed.match(/^[,\s]*$/);
        });

        // 如果内容中有逗号，按逗号分隔计数
        if (text.includes(',')) {
            const commaCount = (text.match(/,/g) || []).length;
            const itemCount = commaCount + 1;
            summary = `[ ${itemCount} ${itemCount === 1 ? 'item' : 'items'} ]`;
        } else if (contentLines.length > 0) {
            // 没有逗号但有内容，说明只有一个元素
            summary = `[ 1 item ]`;
        } else {
            // 空数组
            summary = `[ 0 items ]`;
        }
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


