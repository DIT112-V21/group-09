extends Reference

var mod_name: String = "mars"

func init(global) -> void:
	
	global.register_environment("mars/Mars", preload("res://src/environments/mars/Mars.tscn"))
	
