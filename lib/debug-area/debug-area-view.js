'use babel';
/*!
 * Atom Bugs
 * Copyright(c) 2017 Williams Medina <williams.medinaa@gmail.com>
 * MIT Licensed
 */
import { createButton, createIcon, createText, createElement, insertElement, attachEventFromObject } from '../element/index';
import { InspectorView } from '../inspector/index';
import { EventEmitter } from 'events';
import { parse } from 'path';
export class DebugAreaView {
    constructor(options) {
        this.events = new EventEmitter();
        this.consoleElement = createElement('atom-bugs-console');
        this.consoleElement.setAttribute('tabindex', '-1');
        this.pauseButton = createButton({
            click: () => {
                this.events.emit('didPause');
            }
        }, [createIcon('pause'), createText('Pause')]);
        this.resumeButton = createButton({
            click: () => {
                this.events.emit('didResume');
            }
        }, [createIcon('resume'), createText('Resume')]);
        this.togglePause(false);
        this.debugAreaElement = createElement('atom-bugs-area');
        this.callStackContentElement = createElement('atom-bugs-group-content', {
            className: 'callstack'
        });
        this.scopeContentElement = createElement('atom-bugs-group-content', {
            className: 'scope'
        });
        this.breakpointContentElement = createElement('atom-bugs-group-content', {
            className: 'breakpoint'
        });
        insertElement(this.debugAreaElement, [
            createElement('atom-bugs-controls', {
                elements: [
                    this.pauseButton,
                    this.resumeButton,
                    createButton({
                        click: () => {
                            this.events.emit('didStepOver');
                        }
                    }, [createIcon('step-over')]),
                    createButton({
                        click: () => {
                            this.events.emit('didStepInto');
                        }
                    }, [createIcon('step-into')]),
                    createButton({
                        click: () => {
                            this.events.emit('didStepOut');
                        }
                    }, [createIcon('step-out')])
                ]
            }),
            createElement('atom-bugs-group', {
                elements: [
                    createElement('atom-bugs-group-header', {
                        elements: [createText('Call Stack')]
                    }),
                    this.callStackContentElement
                ]
            }),
            createElement('atom-bugs-group', {
                elements: [
                    createElement('atom-bugs-group-header', {
                        elements: [createText('Scope')]
                    }),
                    this.scopeContentElement
                ]
            }),
            createElement('atom-bugs-group', {
                elements: [
                    createElement('atom-bugs-group-header', {
                        elements: [createText('Breakpoints')]
                    }),
                    this.breakpointContentElement
                ]
            })
        ]);
        attachEventFromObject(this.events, [
            'didPause',
            'didResume',
            'didStepOver',
            'didStepInto',
            'didStepOut',
            'didBreak',
            'didOpenFile',
            'didRequestProperties'
        ], options);
    }
    togglePause(status) {
        this.resumeButton.style.display = status ? null : 'none';
        this.pauseButton.style.display = status ? 'none' : null;
    }
    // setPausedScript (filePath: string, lineNumber: number) {
    //   this.consoleCreateLine('', [
    //     createText('Pause on'),
    //     createText(`${filePath}:${lineNumber}`)
    //   ])
    // }
    // Debug
    createFrameLine(frame, indicate) {
        let file = parse(frame.filePath);
        let indicator = createIcon(indicate ? 'arrow-right-solid' : '');
        if (indicate) {
            indicator.classList.add('active');
        }
        return createElement('atom-bugs-group-item', {
            options: {
                click: () => {
                    this.events.emit('didOpenFile', frame.filePath, frame.lineNumber, frame.columnNumber);
                }
            },
            elements: [
                createElement('span', {
                    elements: [indicator, createText(frame.name || '(anonymous)')]
                }),
                createElement('span', {
                    className: 'file-reference',
                    elements: [
                        createText(file.base),
                        createElement('span', {
                            className: 'file-position',
                            elements: [createText(`${frame.lineNumber}${frame.columnNumber > 0 ? ':' + frame.columnNumber : ''}`)]
                        })
                    ]
                })
            ]
        });
    }
    getBreakpointId(filePath, lineNumber) {
        let token = btoa(`${filePath}${lineNumber}`);
        return `breakpoint-${token}`;
    }
    createBreakpointLine(filePath, lineNumber) {
        let file = parse(filePath);
        insertElement(this.breakpointContentElement, createElement('atom-bugs-group-item', {
            id: this.getBreakpointId(filePath, lineNumber),
            elements: [
                createIcon('break'),
                createElement('span', {
                    className: 'file-reference',
                    elements: [
                        createText(file.base),
                        createElement('span', {
                            className: 'file-position',
                            elements: [createText(String(lineNumber))]
                        })
                    ]
                })
            ]
        }));
    }
    removeBreakpointLine(filePath, lineNumber) {
        let id = this.getBreakpointId(filePath, lineNumber);
        let element = this.breakpointContentElement.querySelector(`[id='${id}']`);
        if (element) {
            element.remove();
        }
    }
    clearBreakpoints() {
        this.breakpointContentElement.innerHTML = '';
    }
    insertCallStackFromFrames(frames) {
        this.clearCallStack();
        frames.forEach((frame, index) => {
            return insertElement(this.callStackContentElement, this.createFrameLine(frame, index === 0));
        });
    }
    clearCallStack() {
        this.callStackContentElement.innerHTML = '';
    }
    insertScope(scope) {
        this.clearScope();
        let inspector = new InspectorView({
            result: scope,
            didRequestProperties: (result, inspectorView) => {
                this.events.emit('didRequestProperties', result, inspectorView);
            }
        });
        insertElement(this.scopeContentElement, inspector.getElement());
    }
    clearScope() {
        this.scopeContentElement.innerHTML = '';
    }
    getDebugElement() {
        return this.debugAreaElement;
    }
    // Console
    clearConsole() {
        this.consoleElement.innerHTML = '';
    }
    createConsoleLine(entry, elements) {
        let line = createElement('atom-bugs-console-line');
        if (entry && entry.length > 0) {
            line.innerHTML = entry;
        }
        if (elements) {
            insertElement(line, elements);
        }
        setTimeout(() => {
            this.consoleElement.scrollTop = this.consoleElement.scrollHeight;
        }, 250);
        return insertElement(this.consoleElement, line);
    }
    getConsoleElement() {
        return this.consoleElement;
    }
    // Destroy all
    destroy() {
        this.consoleElement.remove();
        this.debugAreaElement.remove();
    }
}
//# sourceMappingURL=debug-area-view.js.map