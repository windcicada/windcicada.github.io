# VIM快速配置


# VIM 编辑器快速配置

<div style="align: center">
<img src="../images/vimlogo.png" alt="Vim Logo" width="300" height="300" >
</div>



## 基础插件

安装**ctags, vim-scripts, vim-addon-manager, taglist, winmanager**, 以Debian类系统为例.

```bash
sudo apt-get install vim
sudo apt-get install ctags
sudo apt-get install vim-scripts
sudo apt-get install vim-addon-manager
vim-addons install taglist
vim-addons install winmanager
```
若后续安装[coc.nvim](https://github.com/neoclide/coc.nvim)作为智能补全插件，还需安装nodejs, yarn, clangd.

```bash
sudo apt-get install nodejs yarn clangd
```



## 安装 VIM-Plug

使用[VIM-Plug](https://github.com/junegunn/vim-plug)作为插件管理器，安装命令如下.

```bash
curl -fLo ~/.vim/autoload/plug.vim --create-dirs https://raw.githubusercontent.com/junegunn/vim-plug/master/plug.vim
```

VIM-Plug插件管理基本命令：

首先, 打开vim, 在vim命令模式中

```vim 
PlugStatus   #插件状态
PlugInstall  #安装.vimrc文件中Plug命令声明的插件
PlugUpdate   #安装或更新插件
PlugClean    #删除.vimrc文件中无声明的插件
PlugDiff     #检查上次更新的更改和挂起的更改
PlugSnapshot #生成用于快速恢复插件当前状态的脚本(备份)
```



## 编辑 "~/.vimrc" 文件

参考配置如下.

```.vimrc
"vim-plug ##################################
call plug#begin('~/.vim/plugged')
Plug 'itchyny/lightline.vim'
Plug 'neoclide/coc.nvim',{'branch':'release'}
Plug 'preservim/nerdtree'
Plug 'Xuyuanp/nerdtree-git-plugin'
Plug 'Yggdroot/LeaderF', { 'do': './install.sh' }
Plug 'jiangmiao/auto-pairs'
Plug 'crusoexia/vim-monokai'
Plug 'luochen1990/rainbow'
Plug 'vim-airline/vim-airline'
Plug 'vim-airline/vim-airline-themes'
call plug#end()
"Coc.nvim ##################################
"nodejs yarn clangd is needed for coc.nvim
" use <CR> to confirm completion and format
inoremap <silent><expr> <cr> pumvisible() ? coc#_select_confirm() : "\<C-g>u\<CR>\<c-r>=coc#on_enter()\<CR>"
" use <tab> for trigger completion and navigate to the next complete item
function! s:check_back_space() abort
    let col = col('.') - 1
    return !col || getline('.')[col - 1]  =~ '\s'
endfunction
inoremap <silent><expr> <Tab>
	\ pumvisible() ? "\<C-n>" :
	\ <SID>check_back_space() ? "\<Tab>" :
	\ coc#refresh()
"nerdtree ###################################
map <C-n> :NERDTreeToggle<CR>
let NERDTreeShowBookmarks=1
autocmd vimenter * if !argc()|NERDTree|endif
autocmd bufenter * if (winnr("$") == 1 && exists("b:NERDTree") && b:NERDTree.isTabTree()) | q | endif
let g:NERDTreeDirArrowExpandable = '+'
let g:NERDTreeDirArrowCollapsible = '-'
let g:NERDTreeShowLineNumbers=0
let g:NERDTreeHidden=1
let NERDTreeMinimalUI = 1
let NERDTreeDirArrows = 1
"LeaderF #################################
cnoreabbrev fline LeaderfLine
cnoreabbrev ffunc LeaderfFunctioN
"auto-pairs ##################################
au Filetype FILETYPE let b:AutoPairs = {"(": ")"}
au FileType php      let b:AutoPairs = AutoPairsDefine({'<?' : '?>', '<?php': '?>'})
"vim-monokai ##################################
colo monokai
"rainbow ##################################
let g:rainbow_active = 1
let g:rainbow_conf = {
			\   'guifgs': ['darkorange3', 'seagreen3', 'royalblue3', 'firebrick'],
			\   'ctermfgs': ['lightyellow', 'lightcyan','lightblue', 'lightmagenta'],
			\   'operators': '_,_',
			\   'parentheses': ['start=/(/ end=/)/ fold', 'start=/\[/ end=/\]/ fold', 'start=/{/ end=/}/ fold'],
			\   'separately': {
			\       '*': {},
			\       'tex': {
			\           'parentheses': ['start=/(/ end=/)/', 'start=/\[/ end=/\]/'],
			\       },
			\       'lisp': {
			\           'guifgs': ['darkorange3', 'seagreen3', 'royalblue3', 'firebrick'],
			\       },
			\       'vim': {
			\           'parentheses': ['start=/(/ end=/)/', 'start=/\[/ end=/\]/', 'start=/{/ end=/}/ fold', 'start=/(/ end=/)/ containedin=vimFuncBody', 'start=/\[/ end=/\]/ containedin=vimFuncBody', 'start=/{/ end=/}/ fold containedin=vimFuncBody'],
			\       },
			\       'html': {
			\           'parentheses': ['start=/\v\<((area|base|br|col|embed|hr|img|input|keygen|link|menuitem|meta|param|source|track|wbr)[ > ])@!\z([-_:a-zA-Z0-9]+)(\s+[-_:a-zA-Z0-9]+(\=("[^"]*"|'."'".'[^'."'".']*'."'".'|[^ '."'".'"><=`]*))?)*\>/ end=#</\z1># fold'],
			\       },
			\       'css': 0,
			\   }
			\}
"vim-airline #################################
let g:airline_powerline_fonts = 1
let g:airline#extensions#whitespace#enabled = 0
let g:airline#extensions#whitespace#symbol = '!'
"
"VIM SETTINGS #################################
set helplang=cn 
set langmenu=zh_CN.UTF-8
set encoding=utf8 
set fencs=utf-8,ucs-bom,shift-jis,gb18030,gbk,gb2312,cp936
set syntax=on
set nocompatible
set confirm
set autoindent
set cindent
set tabstop=4
set autoread
set number
set nobackup
set noswapfile
set ignorecase
set hlsearch
filetype on
filetype plugin on
filetype indent on
set iskeyword+=_,$,@,%,-
set wildmenu
set incsearch
set mouse=a
set selection=exclusive
set report=0
set smartindent
set statusline=%r%h%w\ [POS=%l,%v][%p%%]\ %{strftime(\"%d/%m/%y\ -\ %H:%M\")}
set laststatus=2
autocmd InsertLeave * se nocul  
autocmd InsertEnter * se cul    
"ctags #################################
set tags=/home/ubuntu/fileserver/aecsc2/SRC/tags
let Tlist_Sort_Type = "name"    
let Tlist_Compart_Format = 1    
let Tlist_Exist_OnlyWindow = 1  
let Tlist_Ctags_Cmd = '/usr/bin/ctags' 
let Tlist_Show_One_File = 0  
let Tlist_Exit_OnlyWindow = 1  
let Tlist_Use_Right_Window = 0 
" minibufexpl
let g:miniBufExplMapWindowNavVim = 1
let g:miniBufExplMapWindowNavArrows = 1
let g:miniBufExplMapCTabSwitchBufs = 1
let g:miniBufExplModSelTarget = 1
" FORTRAN
let fortran_have_tabs = 1
" let fortran_fold = 1
" set tags=/home/ubuntu/fileserver/aecsc2/SRC/tags
let g:winManagerWindowLayout='FileExplorer|TagList'
nmap <F3> : WMToggle<cr>
"
"Auto write for c,h,sh,java #################################
autocmd BufNewFile *.cpp,*.[ch],*.sh,*.jrva exec ":call SetTitle()" 
func SetTitle() 
	if &filetype == 'sh' 
		call setline(1,"\#########################################################################") 
		call append(line("."), "\# File Name: ".expand("%")) 
		call append(line(".")+1, "\# Author: Dong") 
		call append(line(".")+2, "\# mail: wangyudong@buaa.edu.cn") 
		call append(line(".")+3, "\# Created Time: ".strftime("%c")) 
		call append(line(".")+4, "\#########################################################################") 
		call append(line(".")+5, "\#!/bin/bash") 
		call append(line(".")+6, "") 
		"	elseif &filetype == 'F'
		"		call setline(1, "C*************************************************************************") 
		"        call append(line("."), "C   > File Name: ".expand("%")) 
		"        call append(line(".")+1, "C   > Author: Dong") 
		"        call append(line(".")+2, "C   > Mail: wangyudong@buaa.edu.cn") 
		"        call append(line(".")+3, "C   > Created Time: ".strftime("%c")) 
		"        call append(line(".")+4, "C************************************************************************") 
		"        call append(line(".")+5, "")
		"	elseif &filetype == 'F90'
		"		call setline(1, "!*************************************************************************") 
		"        call append(line("."), "!   > File Name: ".expand("%")) 
		"        call append(line(".")+1, "!   > Author: Dong") 
		"        call append(line(".")+2, "!   > Mail: wangyudong@buaa.edu.cn") 
		"        call append(line(".")+3, "!   > Created Time: ".strftime("%c")) 
		"        call append(line(".")+4, "!************************************************************************") 
		"        call append(line(".")+5, "")
	else 
		call setline(1, "/*************************************************************************") 
		call append(line("."), "    > File Name: ".expand("%")) 
		call append(line(".")+1, "    > Author: Dong") 
		call append(line(".")+2, "    > Mail: wangyudong@buaa.edu.cn") 
		call append(line(".")+3, "    > Created Time: ".strftime("%c")) 
		call append(line(".")+4, " ************************************************************************/") 
		call append(line(".")+5, "")
	endif
	if &filetype == 'cpp'
		call append(line(".")+6, "#include<iostream>")
		call append(line(".")+7, "using namespace std;")
		call append(line(".")+8, "")
	endif
	if &filetype == 'c'
		call append(line(".")+6, "#include<stdio.h>")
		call append(line(".")+7, "")
	endif
	autocmd BufNewFile * normal G
endfunc 
```




