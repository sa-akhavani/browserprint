all: 
	pdflatex -synctex=1 -shell-escape main.tex
	bibtex main
	pdflatex -synctex=1 -shell-escape main.tex
	pdflatex -synctex=1 -shell-escape main.tex

clean:
	rm -f *.dvi *.ps *.aux *.log *.bbl *.blg
