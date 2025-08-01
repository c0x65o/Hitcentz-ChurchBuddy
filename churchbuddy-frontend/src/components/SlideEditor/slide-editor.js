class SlideEditor {
    constructor(container, options = {}) {
        this.container = container;
        this.onSave = options.onSave || (() => {});
        this.htmlContent = options.htmlContent || '';

        this.selectedElement = null;
        this.editorEl = null;
        this.toolbarEl = null;
        this.elementToolbarEl = null;
        this.canvasEl = null;
        this.deleteBtn = null;
        this.layerControlsEl = null;
        this.layerDividerEl = null;
        
        // Drag/resize state
        this.isDragging = false;
        this.isResizing = false;

        this._init();
    }

    async _init() {
        try {
            const response = await fetch('slide-editor.html');
            if (!response.ok) throw new Error('Failed to fetch editor template');
            const templateHtml = await response.text();
            this.container.innerHTML = templateHtml;

            this.editorEl = this.container.querySelector('.slide-editor-container');
            this.toolbarEl = this.editorEl.querySelector('.slide-editor-toolbar');
            this.elementToolbarEl = this.editorEl.querySelector('#element-toolbar');
            this.canvasEl = this.editorEl.querySelector('#slide-canvas');
            this.deleteBtn = this.toolbarEl.querySelector('[data-action="delete-element"]');
            this.layerControlsEl = this.editorEl.querySelector('#layer-controls');
            this.layerDividerEl = this.editorEl.querySelector('#layer-divider');
            
            this._initEventListeners();
            this.load(this.htmlContent);

        } catch (error) {
            console.error('Error initializing SlideEditor:', error);
            this.container.innerHTML = '<p>Error loading slide editor. See console for details.</p>';
        }
    }

    _initEventListeners() {
        // General toolbar actions
        this.toolbarEl.addEventListener('click', e => {
            const button = e.target.closest('button[data-action]');
            if (!button) return;

            switch (button.dataset.action) {
                case 'add-text':
                    this.addTextBox();
                    break;
                case 'add-image':
                    this.addImage();
                    break;
                case 'delete-element':
                    this.deleteSelectedElement();
                    break;
                case 'move-forward':
                    this._moveSelectedElement(1);
                    break;
                case 'move-backward':
                    this._moveSelectedElement(-1);
                    break;
                case 'move-to-front':
                    this._moveSelectedElement('front');
                    break;
                case 'move-to-back':
                    this._moveSelectedElement('back');
                    break;
            }
        });
        
        // Element-specific toolbar actions
        this.elementToolbarEl.addEventListener('change', e => {
            if (!this.selectedElement) return;
            const target = e.target;
            const property = target.dataset.property;
            const contentEl = this.selectedElement.querySelector('[contenteditable]');

            if (property && contentEl) {
                contentEl.style[property] = target.value + (property === 'fontSize' ? 'px' : '');
                this._save();
            }
        });
        
        this.elementToolbarEl.addEventListener('click', e => {
             const button = e.target.closest('button[data-action]');
             if (!button || !this.selectedElement) return;
             
             if(button.dataset.action === 'rotate') {
                this.rotateSelectedElement();
                return;
             }

             document.execCommand(button.dataset.action, false, null);
             this._save();
        });


        // Deselect when clicking canvas background
        this.canvasEl.addEventListener('mousedown', e => {
            if (e.target === this.canvasEl) {
                this.selectElement(null);
            }
        });
        
        // Keyboard shortcuts
        this.editorEl.addEventListener('keydown', e => {
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (this.selectedElement && document.activeElement !== this.selectedElement.querySelector('[contenteditable]')) {
                    e.preventDefault();
                    this.deleteSelectedElement();
                }
            }
        });
    }

    load(html) {
        this.canvasEl.innerHTML = html || '';
        let maxZ = 0;
        this.canvasEl.querySelectorAll('.editable-element').forEach(el => {
            this._makeElementInteractive(el);
            let z = parseInt(el.style.zIndex, 10);
            if (!isNaN(z)) {
                if (z > maxZ) maxZ = z;
            }
        });

        // Ensure all elements have a z-index to avoid stacking issues
        this.canvasEl.querySelectorAll('.editable-element').forEach(el => {
            if (!el.style.zIndex) {
                el.style.zIndex = ++maxZ;
            }
        });
        this.selectElement(null); // Ensure nothing is selected on load
    }

    getHtml() {
        const cleanCanvas = this.canvasEl.cloneNode(true);
        cleanCanvas.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
        cleanCanvas.querySelectorAll('.resize-handle').forEach(h => h.remove());
        return cleanCanvas.innerHTML;
    }

    _save() {
        this.onSave(this.getHtml());
    }

    addTextBox() {
        const element = document.createElement('div');
        element.className = 'editable-element';
        element.style.top = '50px';
        element.style.left = '50px';
        element.style.width = '200px';
        element.style.height = '50px';
        element.style.zIndex = this._getTopZIndex() + 1;

        element.innerHTML = `<div contenteditable="true" style="color: #ffffff; font-size: 24px;">New Text</div>`;

        this.canvasEl.appendChild(element);
        this._makeElementInteractive(element);
        this.selectElement(element);
        this._save();
    }

    async addImage() {
        const imageUrl = prompt("Enter image URL:");
        if (!imageUrl) return;

        const element = document.createElement('div');
        element.className = 'editable-element image-element';
        element.style.top = '50px';
        element.style.left = '50px';
        element.style.width = '300px';
        element.style.height = 'auto'; // Auto-height for aspect ratio
        element.style.zIndex = this._getTopZIndex() + 1;

        element.innerHTML = `<img src="${imageUrl}" style="width: 100%; height: 100%; object-fit: contain;">`;
        element.dataset.rotation = "0";

        this.canvasEl.appendChild(element);
        this._makeElementInteractive(element);
        this.selectElement(element);
        this._save();
    }

    rotateSelectedElement() {
        if (!this.selectedElement) return;
        let currentRotation = parseInt(this.selectedElement.dataset.rotation || '0', 10);
        currentRotation = (currentRotation + 90) % 360;
        this.selectedElement.dataset.rotation = currentRotation;
        this.selectedElement.style.transform = `rotate(${currentRotation}deg)`;
        this._save();
    }

    deleteSelectedElement() {
        if (!this.selectedElement) return;
        this.selectedElement.remove();
        this.selectElement(null);
        this._save();
    }

    selectElement(element) {
        // Deselect previous
        if (this.selectedElement) {
            this.selectedElement.classList.remove('selected');
        }

        this.selectedElement = element;

        if (this.selectedElement) {
            this.selectedElement.classList.add('selected');
            this.deleteBtn.disabled = false;
            this.layerControlsEl.style.display = 'flex';
            this.layerDividerEl.style.display = 'block';
            this._updateElementToolbar();
        } else {
            // Nothing selected, clear the element toolbar
            this.deleteBtn.disabled = true;
            this.layerControlsEl.style.display = 'none';
            this.layerDividerEl.style.display = 'none';
            this.elementToolbarEl.innerHTML = '<span class="toolbar-placeholder">Select an element to see formatting options</span>';
        }
    }
    
    _updateElementToolbar() {
        if (!this.selectedElement) return;

        // Check if it's an image element
        const imgEl = this.selectedElement.querySelector('img');
        if(imgEl) {
             this.elementToolbarEl.innerHTML = `
                <button class="toolbar-btn" data-action="rotate" title="Rotate 90°"><i class="fas fa-sync-alt"></i></button>
            `;
            return;
        }

        // For now, we only support text elements
        const contentEl = this.selectedElement.querySelector('[contenteditable]');
        if (contentEl) {
            const style = window.getComputedStyle(contentEl);
            this.elementToolbarEl.innerHTML = `
                <select data-property="fontFamily">
                    <option>Arial</option>
                    <option>Verdana</option>
                    <option>Georgia</option>
                    <option>Times New Roman</option>
                    <option>Poppins</option>
                </select>
                <input type="number" data-property="fontSize" value="${parseInt(style.fontSize)}" min="1">
                <input type="color" data-property="color" value="${this._rgbToHex(style.color)}">
                <div class="toolbar-divider"></div>
                <button class="toolbar-btn" data-action="bold"><i class="fas fa-bold"></i></button>
                <button class="toolbar-btn" data-action="italic"><i class="fas fa-italic"></i></button>
                <button class="toolbar-btn" data-action="underline"><i class="fas fa-underline"></i></button>
            `;
            this.elementToolbarEl.querySelector(`[data-property="fontFamily"]`).value = style.fontFamily.split(',')[0].replace(/"/g, '');
        } else {
            this.selectElement(null);
        }
    }
    
    _rgbToHex(rgb) {
        let a = rgb.split("(")[1].split(")")[0];
        a = a.split(",");
        let b = a.map(function(x){
            x = parseInt(x).toString(16);
            return (x.length==1) ? "0"+x : x;
        });
        return "#"+b.join("");
    }

    _makeElementInteractive(element) {
        // Add resize handle
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'resize-handle bottom-right';
        element.appendChild(resizeHandle);

        let startX, startY, startWidth, startHeight, offsetX, offsetY;
        
        const onElementMouseDown = (e) => {
            // Prevent starting drag on contenteditable part
            if (e.target.isContentEditable) return;
            e.preventDefault();
            this.selectElement(element);

            this.isDragging = true;
            offsetX = e.clientX - element.offsetLeft;
            offsetY = e.clientY - element.offsetTop;
            
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        };
        
        const onResizeMouseDown = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.selectElement(element);
            
            this.isResizing = true;
            startX = e.clientX;
            startY = e.clientY;
            startWidth = parseInt(document.defaultView.getComputedStyle(element).width, 10);
            startHeight = parseInt(document.defaultView.getComputedStyle(element).height, 10);
            
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        };
        
        const onMouseMove = (e) => {
            if (this.isDragging) {
                element.style.left = (e.clientX - offsetX) + 'px';
                element.style.top = (e.clientY - offsetY) + 'px';
            }
            if (this.isResizing) {
                const newWidth = startWidth + e.clientX - startX;
                element.style.width = newWidth + 'px';
                // If it's an image, maintain aspect ratio
                const img = element.querySelector('img');
                if (img) {
                    element.style.height = 'auto';
                } else {
                     element.style.height = (startHeight + e.clientY - startY) + 'px';
                }
            }
        };

        const onMouseUp = () => {
            if(this.isResizing && element.querySelector('img')) {
                element.style.height = element.getBoundingClientRect().height + 'px';
            }
            if(this.isDragging || this.isResizing) {
                this._save();
            }
            this.isDragging = false;
            this.isResizing = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
        
        element.addEventListener('mousedown', onElementMouseDown);
        resizeHandle.addEventListener('mousedown', onResizeMouseDown);
        
        // Save on content change
        const contentEl = element.querySelector('[contenteditable]');
        if (contentEl) {
            contentEl.addEventListener('input', () => this._save());
        }
    }

    _getTopZIndex() {
        let maxZ = 0;
        this.canvasEl.querySelectorAll('.editable-element').forEach(el => {
            const z = parseInt(el.style.zIndex, 10) || 0;
            if (z > maxZ) maxZ = z;
        });
        return maxZ;
    }

    _moveSelectedElement(direction) {
        if (!this.selectedElement) return;

        const elements = Array.from(this.canvasEl.querySelectorAll('.editable-element'))
            .sort((a, b) => (parseInt(a.style.zIndex, 10) || 0) - (parseInt(b.style.zIndex, 10) || 0));

        if (direction === 'front') {
            const topZ = parseInt(elements[elements.length - 1].style.zIndex, 10) || 0;
            this.selectedElement.style.zIndex = topZ + 1;
        } else if (direction === 'back') {
            const bottomZ = parseInt(elements[0].style.zIndex, 10) || 0;
            this.selectedElement.style.zIndex = bottomZ - 1;
        } else {
            const currentIndex = elements.findIndex(el => el === this.selectedElement);
            const newIndex = currentIndex + direction;

            if (newIndex >= 0 && newIndex < elements.length) {
                const otherElement = elements[newIndex];
                // Swap z-indices
                [this.selectedElement.style.zIndex, otherElement.style.zIndex] =
                    [otherElement.style.zIndex, this.selectedElement.style.zIndex];
            }
        }
        this._save();
    }
}
